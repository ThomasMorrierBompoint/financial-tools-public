/* PrimeVue 5 licence key. Verified offline — signature only, no network call, no domain check.
   It ships publicly in the deployed bundle by design (design.md §3), which is why it lives alone
   in this file and nowhere else.

   In place since 2026-09-16. Decoding the token's own payload: product "primeui", tier
   "community", type "dev", issued 2026-09-16, expiry 2027-09-16. Renewing is editing the one
   string below.

   Once it expires — or if it is ever removed — PrimeVue logs "[PrimeUI] PrimeUI license is not
   configured." and injects a fixed bottom-right badge in a closed shadow root that cannot be
   styled or removed. Verified with this key in Chromium: no warning, no badge.

   The payload says type "dev". Whether that covers a deployed public site, and whether publishing
   the key in a public repository is acceptable, are the two questions open with PrimeTek
   (README.md §11). */
window.PRIMEUI_LICENSE = 'eyJpZCI6IjU4M2E4YzM0LTgwOTEtNDU5OC1iYzVmLTQ3NzE1ODkzOGNmMiIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODk1OTU1OTYsImV4cCI6MTgyMTEzMTU5Nn0.74aOXCUu4RSN-P6EJ_RBGCuwjYIBaZGFkVVcJgxZl5-9Hv5F77o916B4bejWhUXcYHwTu9Nq5X5ey9Yfy9mvAg';
