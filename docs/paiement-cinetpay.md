# Paiement par CinetPay

CinetPay agrège les moyens de paiement mobiles d'Afrique de l'Ouest (Orange
Money, MTN, Moov, Wave, cartes) et règle en XOF. Contrairement au lien Wave
statique utilisé jusqu'ici, il expose un rappel signé et une API de
vérification : les paiements se soldent donc tout seuls.

## Activer

Dans `infra/.env` sur le serveur :

```sh
PAYMENT_PROVIDER=cinetpay
CINETPAY_API_KEY=…
CINETPAY_SITE_ID=…
CINETPAY_SECRET_KEY=…
PUBLIC_ORIGIN=https://menu.sukaxess.com
```

Puis `make api-up`.

La **clé secrète** se trouve dans le tableau de bord CinetPay, section
Intégrations. C'est un identifiant distinct de la clé API : elle sert à signer
l'en-tête `x-token` des notifications.

Dans le tableau de bord, déclarer l'URL de notification :

```
https://menu.sukaxess.com/api/payments/webhook/cinetpay
```

Rien d'autre à configurer : l'API construit elle-même cette URL à partir de
`PUBLIC_ORIGIN`, ainsi que l'URL de retour vers `/mes-commandes`.

## Ce qui décide qu'une commande est payée

Trois contrôles, dans cet ordre, et il faut les trois :

1. **La signature.** L'en-tête `x-token` est un HMAC-SHA256 des champs de la
   notification, dans l'ordre imposé par CinetPay, avec la clé secrète. Une
   notification non signée est rejetée sans même être examinée.
2. **La vérification directe.** Le contenu de la notification n'est jamais cru :
   il sert seulement à savoir *quelle transaction* interroger. Le statut vient
   d'un appel serveur à serveur vers `/v2/payment/check`, en TLS, avec la clé
   API. C'est cet appel qui fait autorité.
3. **Le montant.** La réponse de CinetPay est comparée au total enregistré de la
   commande. Un rappel annonçant moins — paiement partiel, référence rejouée,
   transaction manipulée — laisse la commande impayée, et l'écart est écrit
   dans les logs en niveau erreur.

Une commande soldée est tracée dans le journal d'audit et diffusée aux écrans
de cuisine par le flux temps réel.

## Retour en arrière

`PAYMENT_PROVIDER=manual` rebascule sur la confirmation à la main sans rien
changer d'autre : les commandes déjà payées le restent, les suivantes attendent
le back-office. Utile si CinetPay est indisponible.

## Points à confirmer avec CinetPay

- **Granularité des montants.** Certains canaux imposent un pas sur les montants
  en XOF. Le code ne devine rien : si CinetPay refuse une initialisation, son
  message est remonté tel quel plutôt que d'être masqué par un arrondi qui
  ferait diverger le montant facturé de celui enregistré. À vérifier sur vos
  premiers vrais paiements.
- **Devise.** `XOF` est codé en dur, cohérent avec des prix stockés en francs
  entiers.

## Tests

`apps/api/test/cinetpay.test.ts` couvre l'intégration contre un `fetch` simulé,
sans toucher au compte réel : signature absente ou fausse rejetée sans appel
réseau, notification annonçant un paiement mais infirmée par la vérification,
paiement confirmé, refus d'initialisation remonté.

`apps/api/test/security.test.ts` vérifie le garde-fou sur le montant, avec un
rappel vérifié mais minoré.
