# Reference API Complte

Liste exhaustive de toutes les fonctions disponibles dans le SDK.

---

## Server - Payments (`@stripe-sdk/core/server`)

| Fonction | Description |
|---|---|
| `createPaymentIntent(input)` | Creer un paiement |
| `retrievePaymentIntent(id)` | Recuperer un paiement |
| `confirmPaymentIntent(input)` | Confirmer un paiement |
| `cancelPaymentIntent(id)` | Annuler un paiement |
| `listPaymentIntents(input?)` | Lister les paiements |
| `createCheckoutSession(input)` | Creer une session Checkout |
| `retrieveCheckoutSession(id)` | Recuperer une session Checkout |
| `listCheckoutSessions(input?)` | Lister les sessions Checkout |
| `createPaymentLink(input)` | Creer un lien de paiement |
| `retrievePaymentLink(id)` | Recuperer un lien de paiement |
| `createSetupIntent(input)` | Creer un SetupIntent (sauvegarder carte) |
| `retrieveSetupIntent(id)` | Recuperer un SetupIntent |
| `listPaymentMethods(customerId, type?)` | Lister les moyens de paiement |
| `attachPaymentMethod(pmId, cusId)` | Attacher un moyen de paiement |
| `detachPaymentMethod(pmId)` | Detacher un moyen de paiement |

## Server - Customers

| Fonction | Description |
|---|---|
| `createCustomer(input)` | Creer un client |
| `retrieveCustomer(id)` | Recuperer un client |
| `updateCustomer(input)` | Mettre a jour un client |
| `deleteCustomer(id)` | Supprimer un client |
| `listCustomers(input?)` | Lister les clients |
| `searchCustomers(query, limit?)` | Rechercher des clients |
| `createPortalSession(input)` | Creer une session portail client |

## Server - Subscriptions

| Fonction | Description |
|---|---|
| `createSubscription(input)` | Creer un abonnement |
| `retrieveSubscription(id)` | Recuperer un abonnement |
| `updateSubscription(input)` | Mettre a jour (changer de plan, etc.) |
| `cancelSubscription(input)` | Annuler un abonnement |
| `resumeSubscription(id)` | Reprendre un abonnement annule |
| `listSubscriptions(input?)` | Lister les abonnements |

## Server - Products & Prices

| Fonction | Description |
|---|---|
| `createProduct(input)` | Creer un produit |
| `retrieveProduct(id)` | Recuperer un produit |
| `updateProduct(input)` | Mettre a jour un produit |
| `archiveProduct(id)` | Archiver un produit |
| `listProducts(input?)` | Lister les produits |
| `createPrice(input)` | Creer un prix |
| `retrievePrice(id)` | Recuperer un prix |
| `listPrices(input?)` | Lister les prix |
| `archivePrice(id)` | Archiver un prix |

## Server - Invoices

| Fonction | Description |
|---|---|
| `createInvoice(input)` | Creer une facture |
| `retrieveInvoice(id)` | Recuperer une facture |
| `finalizeInvoice(id)` | Finaliser une facture |
| `sendInvoice(id)` | Envoyer par email |
| `payInvoice(id)` | Marquer comme payee |
| `voidInvoice(id)` | Annuler une facture |
| `listInvoices(input?)` | Lister les factures |
| `getUpcomingInvoice(cusId, subId?)` | Preview prochaine facture |
| `createInvoiceItem(input)` | Ajouter une ligne de facture |

## Server - Refunds & Disputes

| Fonction | Description |
|---|---|
| `createRefund(input)` | Creer un remboursement |
| `retrieveRefund(id)` | Recuperer un remboursement |
| `listRefunds(input?)` | Lister les remboursements |
| `retrieveDispute(id)` | Recuperer un litige |
| `updateDispute(input)` | Soumettre des preuves |
| `closeDispute(id)` | Accepter un litige |
| `listDisputes(input?)` | Lister les litiges |

## Server - Connect (Marketplace)

| Fonction | Description |
|---|---|
| `createConnectAccount(input)` | Creer un compte vendeur |
| `retrieveConnectAccount(id)` | Recuperer un compte |
| `deleteConnectAccount(id)` | Supprimer un compte |
| `listConnectAccounts(input?)` | Lister les comptes |
| `createAccountLink(input)` | Lien d'onboarding |
| `createTransfer(input)` | Transferer des fonds |
| `listTransfers(input?)` | Lister les transferts |
| `createPayout(amount, currency)` | Creer un virement |
| `listPayouts(input?)` | Lister les virements |
| `getBalance()` | Solde du compte |
| `listBalanceTransactions(input?)` | Historique des transactions |

## Server - Coupons & Promotions

| Fonction | Description |
|---|---|
| `createCoupon(input)` | Creer un coupon |
| `retrieveCoupon(id)` | Recuperer un coupon |
| `deleteCoupon(id)` | Supprimer un coupon |
| `listCoupons(input?)` | Lister les coupons |
| `createPromotionCode(input)` | Creer un code promo |
| `retrievePromotionCode(id)` | Recuperer un code promo |
| `listPromotionCodes(input?)` | Lister les codes promo |

---

## Client - Hooks (`@stripe-sdk/core/client`)

| Hook | Description |
|---|---|
| `usePayment(options?)` | Confirmer un paiement avec PaymentElement |
| `useSetupIntent(options?)` | Sauvegarder un moyen de paiement |
| `useCheckout(options)` | Rediriger vers Checkout ou le portail |
| `useStripeConfig()` | Acceder a la config du StripeProvider |

## Client - Components

| Composant | Description |
|---|---|
| `<StripeProvider>` | Provider Stripe de base |
| `<StripeElementsProvider>` | Provider avec clientSecret pour les formulaires |
| `<CheckoutForm>` | Formulaire de paiement complet |
| `<SetupForm>` | Formulaire pour sauvegarder un moyen de paiement |
| `<PricingTable>` | Tableau de tarification |
| `<SubscriptionManager>` | Interface de gestion d'abonnement |

---

## Webhooks (`@stripe-sdk/core/webhooks`)

| Fonction | Description |
|---|---|
| `createWebhookHandler(config)` | Handler webhook generique |
| `createNextWebhookHandler(config)` | Handler pour App Router |
| `createPagesWebhookHandler(config)` | Handler pour Pages Router |

---

## Next.js (`@stripe-sdk/core/next`)

| Export | Description |
|---|---|
| `actions.createPaymentIntent` | Server Action paiement |
| `actions.createCheckoutSession` | Server Action checkout |
| `actions.createSetupIntent` | Server Action setup |
| `actions.createCustomer` | Server Action client |
| `actions.createPortalSession` | Server Action portail |
| `actions.createSubscription` | Server Action abonnement |
| `actions.cancelSubscription` | Server Action annulation |
| `actions.resumeSubscription` | Server Action reprise |
| `createPaymentIntentRoute(options?)` | API route pre-construite |
| `createCheckoutSessionRoute(options?)` | API route pre-construite |
| `createPortalSessionRoute()` | API route pre-construite |
