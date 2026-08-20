#!/bin/bash
#
# Checks a deployed instance end to end.
#
#   ./infra/smoke-test.sh https://menu-test.sukaxess.com
#
# Read-only with respect to anything that matters: it registers one throwaway
# account and places one order, and it never confirms a payment, so no money
# and no kitchen work are involved. Safe to run against production, though
# staging is the point.
#
# Beyond "is it up", this asserts the properties the rewrite exists to
# guarantee. A deployment that answers 200 everywhere but lets a visitor grant
# themselves the admin role has not succeeded.
set -uo pipefail

BASE="${1:-}"
[ -n "$BASE" ] || { echo "usage: smoke-test.sh <url>"; exit 2; }
BASE="${BASE%/}"

JAR="$(mktemp -d)"
trap 'rm -rf "$JAR"' EXIT

PASS=0
FAIL=0
SKIP=0
ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS + 1)); }
ko()   { printf '  \033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL + 1)); }
skip() { printf '  \033[33m·\033[0m %s\n' "$1"; SKIP=$((SKIP + 1)); }
head() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# Only 40 characters of a failing response: a broken proxy answers with a whole
# HTML error page, which buries the checks that follow.
brief() { printf '%s' "$1" | tr -d '\n' | cut -c1-120; }

c() { curl -sS --max-time 20 "$@"; }
status() { c -o /dev/null -w '%{http_code}' "$@"; }
json() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)" 2>/dev/null || echo "__ERR__"; }

STAMP="$(date +%s)$RANDOM"
EMAIL="verif-$STAMP@example.invalid"
PASSWORD="mot-de-passe-de-verification"

head "Disponibilité — $BASE"

HEALTH="$(c "$BASE/api/health")"
[ "$(echo "$HEALTH" | json 'd["status"]')" = "ok" ] \
  && ok "l'API répond ($BASE/api/health)" \
  || { ko "l'API ne répond pas : $(brief "$HEALTH")"; echo; echo "Arrêt : rien d'autre ne peut être vérifié."; exit 1; }

[ "$(status "$BASE/")" = "200" ] && ok "le site est servi" || ko "le site ne répond pas"
[ "$(status "$BASE/mes-commandes")" = "200" ] \
  && ok "une route de l'application retombe sur index.html" \
  || ko "la réécriture SPA ne fonctionne pas (Apache : RewriteEngine)"

head "Transport"

case "$BASE" in
  https://*)
    REDIR="$(c -o /dev/null -w '%{http_code}' "${BASE/https:/http:}")"
    [ "$REDIR" = "301" ] || [ "$REDIR" = "302" ] || [ "$REDIR" = "308" ] \
      && ok "HTTP redirige vers HTTPS ($REDIR)" \
      || ko "HTTP ne redirige pas (reçu $REDIR) — certbot a-t-il tourné ?"
    c -D- -o /dev/null "$BASE/" | grep -qi '^strict-transport-security' \
      && ok "HSTS présent" || ko "HSTS absent"
    ;;
  http://127.0.0.1*|http://localhost*)
    skip "instance locale en clair : contrôles TLS sans objet" ;;
  *)
    ko "instance publique servie en clair — les cookies de session ne seront pas Secure" ;;
esac

HEADERS="$(c -D- -o /dev/null "$BASE/")"
echo "$HEADERS" | grep -qi '^x-content-type-options: nosniff' \
  && ok "X-Content-Type-Options" || ko "X-Content-Type-Options absent"
echo "$HEADERS" | grep -qi '^x-frame-options' \
  && ok "X-Frame-Options" || ko "X-Frame-Options absent"

head "Menu public"

MENUS="$(c "$BASE/api/menus/current")"
COUNT="$(echo "$MENUS" | json 'len(d["menus"])')"
if [ "$COUNT" = "__ERR__" ]; then
  ko "le menu public est illisible : $(brief "$MENUS")"
elif [ "$COUNT" = "0" ]; then
  ok "le menu public répond, mais aucun menu n'est publié (catalogue à importer)"
else
  ok "$COUNT menu(s) publié(s), lisibles sans authentification"
fi
MENU_ITEM="$(echo "$MENUS" | json 'd["menus"][0]["items"][0]["menuItemId"]')"
ITEM_PRICE="$(echo "$MENUS" | json 'd["menus"][0]["items"][0]["price"]')"

head "Accès refusé sans session"

for path in /api/me /api/orders/mine /api/admin/orders /api/admin/users /api/admin/roles /api/kitchen/stream; do
  S="$(status "$BASE$path")"
  [ "$S" = "401" ] && ok "$path → 401" || ko "$path → $S (401 attendu)"
done

head "Escalade de privilèges"

REG="$(c -X POST "$BASE/api/auth/register" -H 'Content-Type: application/json' -c "$JAR/user.jar" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Vérification\",\"role\":\"admin\",\"roles\":[\"admin\"],\"isAdmin\":true}")"
ROLES="$(echo "$REG" | json 'd["user"]["roles"]')"
if [ "$ROLES" = "[]" ]; then
  ok "un compte créé avec role/roles/isAdmin n'obtient aucun rôle"
else
  ko "RÔLES OCTROYÉS À L'INSCRIPTION : $ROLES"
fi

if grep -qi 'httponly' "$JAR/user.jar" 2>/dev/null; then
  ok "cookie de session HttpOnly (hors de portée du JavaScript)"
else
  ko "cookie de session lisible par JavaScript"
fi

for ep in "POST /api/admin/roles" "GET /api/admin/users" "GET /api/admin/audit" "POST /api/admin/articles"; do
  M="${ep%% *}"; P="${ep##* }"
  S="$(status -X "$M" "$BASE$P" -b "$JAR/user.jar" -H 'Content-Type: application/json' -d '{}')"
  [ "$S" = "403" ] && ok "$M $P → 403" || ko "$M $P → $S (403 attendu)"
done

head "Intégrité du montant"

if [ "$MENU_ITEM" = "__ERR__" ] || [ -z "$MENU_ITEM" ]; then
  echo "  · aucun menu publié : contrôle du montant ignoré"
else
  ORDER="$(c -X POST "$BASE/api/orders" -H 'Content-Type: application/json' -b "$JAR/user.jar" \
    -d "{\"items\":[{\"menuItemId\":\"$MENU_ITEM\",\"quantity\":2}],\"totalAmount\":1,\"price\":1}")"
  TOTAL="$(echo "$ORDER" | json 'd["order"]["totalAmount"]')"
  EXPECTED=$(( ITEM_PRICE * 2 ))
  ORDER_ID="$(echo "$ORDER" | json 'd["order"]["id"]')"
  RECEIPT="$(echo "$ORDER" | json 'd["order"]["receiptId"]')"

  [ "$TOTAL" = "$EXPECTED" ] \
    && ok "client annonce 1 FCFA, le serveur facture $TOTAL (2 × $ITEM_PRICE)" \
    || ko "montant facturé $TOTAL, attendu $EXPECTED"

  [ "$(echo "$ORDER" | json 'd["order"]["paymentStatus"]')" = "pending" ] \
    && ok "commande créée impayée" || ko "statut de paiement initial inattendu"

  c -o /dev/null "$BASE/?payment_status=success&receipt_id=$RECEIPT"
  sleep 1
  AFTER="$(c "$BASE/api/orders/$ORDER_ID" -b "$JAR/user.jar" | json 'd["order"]["paymentStatus"]')"
  [ "$AFTER" = "pending" ] \
    && ok "?payment_status=success ne solde rien (toujours « $AFTER »)" \
    || ko "LA COMMANDE EST PASSÉE À « $AFTER » VIA L'URL"

  S="$(status -X POST "$BASE/api/payments/$ORDER_ID/confirm" -H 'Content-Type: application/json' -b "$JAR/user.jar" -d '{}')"
  [ "$S" = "403" ] && ok "un client ne peut pas confirmer son paiement → 403" || ko "confirmation client → $S"
fi

head "Divers"

S="$(status "$BASE/api/orders/pas-un-uuid" -b "$JAR/user.jar")"
[ "$S" = "400" ] && ok "identifiant malformé → 400" || ko "identifiant malformé → $S (400 attendu)"

S="$(status -X POST "$BASE/api/payments/webhook/cinetpay" -H 'Content-Type: application/x-www-form-urlencoded' -d 'cpm_trans_id=inexistant')"
case "$S" in
  400|404) ok "webhook de paiement non signé rejeté → $S" ;;
  *)       ko "webhook non signé → $S (400 ou 404 attendu)" ;;
esac

printf '\n\033[1mRésultat : %d réussis' "$PASS"
[ "$FAIL" -eq 1 ] && printf ', 1 échec'
[ "$FAIL" -gt 1 ] && printf ', %d échecs' "$FAIL"
[ "$SKIP" -gt 0 ] && printf ', %d ignoré(s)' "$SKIP"
printf '.\033[0m\n'

if [ "$FAIL" -gt 0 ]; then
  echo "Le compte de vérification $EMAIL a été créé ; supprimez-le depuis le back-office si besoin."
  exit 1
fi
echo "Compte de vérification créé : $EMAIL (désactivable depuis le back-office)."
