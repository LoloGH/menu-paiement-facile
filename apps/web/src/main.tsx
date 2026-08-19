import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/*
 * Nothing but mounting happens here.
 *
 * This file used to run two side effects at start-up: it called RPCs that
 * altered table replica identity and publication membership, and it flipped an
 * order to `validated` whenever the URL carried `?payment_status=success` —
 * which meant visiting a crafted link marked an order paid. Both are gone; a
 * payment is now confirmed on the server or not at all.
 */
const container = document.getElementById("root");
if (!container) throw new Error("élément #root introuvable");

createRoot(container).render(<App />);
