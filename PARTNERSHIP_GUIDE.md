# RavonPay Partnership Guide

This document explains what to learn before onboarding with payment providers such as Payme, Click, Payoneer, Wise, and PayPal.

The goal is to prepare the business and technical team before starting partner integration. This is especially important for a fintech product in Central Asia, where payment regulations, compliance, and onboarding requirements vary widely.

---

## 1. Payme Business — Uzbekistan (wallet top-up)

**Why it matters:** Payme can be used for local wallet funding through Uzcard, Humo, Visa, or Mastercard.

**Where to contact:** https://business.payme.uz/

**What to ask for:**
- Merchant onboarding process
- Required company documents
- Available test/sandbox environment
- Commission rates
- API and webhook format

**Documents usually required:**
- Company registration details or legal entity documents
- Business profile information
- Official contact information

**Keys to request after approval:**
- `PAYME_MERCHANT_ID`
- `PAYME_KEY`

**Questions to ask:**
- Is there a sandbox environment for testing before live payments?
- What are the commission fees?
- Does the checkout format require a custom field instead of `ac.order_id`?

---

## 2. Click Merchant — Uzbekistan (local alternative)

**Why it matters:** Click is a local alternative for funding via domestic cards and business payment flows.

**Where to contact:** https://business.click.uz/uz

**Important:** A personal Click account is not enough. You need a separate **Merchant** account for business use.

**Documents usually required:**
- Passport copy of the authorized person
- Registration documents or company details
- Bank account and MFO details

**Keys to request after approval:**
- `CLICK_SERVICE_ID`
- `CLICK_MERCHANT_ID`
- `CLICK_SECRET_KEY`

**Questions to ask:**
- Is there a sandbox test environment?
- What webhook format is used: JSON or form-encoded?
- What are the standard fees and payout rules?

---

## 3. Payoneer — International income (freelancers / dropshipping)

**Why it matters:** This is one of the most important integrations for a Central Asian fintech product because it supports international payouts for freelancers and sellers.

**Where to contact:** https://www.payoneer.com/integration-partnerships/

**Difference from others:** This is not wallet top-up; it is a payout solution for users who receive income and want to withdraw to a local Uzbek bank account or card.

**What to prepare before applying:**
- Short business description
- Business model overview
- Estimated user count or transaction volume
- Website or product demo link

**Keys to request after approval:**
- `PAYONEER_CLIENT_ID`
- `PAYONEER_CLIENT_SECRET`
- `PAYONEER_PROGRAM_ID`
- API endpoints and payout documentation

**Questions to ask:**
- How easy is onboarding for Uzbek users?
- How much is the payout fee?
- How long does withdrawal take?

---

## 4. Wise Platform — International transfers

**Why it matters:** Wise is a strong international transfer option and a useful alternative or backup provider.

**Where to contact:** https://wise.com/gb/partner/

**Process:** You will work with the sales and implementation team to choose the right integration model.

**What they may provide:**
- `client_id`
- `client_secret`
- Redirect URL for OAuth or user return flow

**Questions to ask:**
- Does Wise handle KYC or does the partner handle it?
- Are Uzbekistan and Central Asian countries supported?
- What are the payout and compliance requirements?

**Technical contact:** api@wise.com

---

## 5. PayPal — International payments (most difficult)

**Why it matters:** PayPal is often the hardest and slowest route for new fintech products, especially smaller startups.

**Where to contact:** PayPal partner application form

**Process:**
- Test in sandbox first
- Then request live credentials after approval
- Only then can production operations begin

**Important distinction:** PayPal may allow receiving payments in some markets but not payouts in others. This must be checked before building around it.

**Questions to ask:**
- Is Uzbekistan supported for payouts?
- Does the model allow receiving only or both receiving and sending?
- What are the compliance checks and business requirements?

---

## Recommended Order of Execution

1. **First:** Payme or Click
   - Best for local wallet top-up
   - Fastest to test and deploy in Uzbekistan

2. **Second:** Payoneer
   - Most directly aligned with freelancer and remote worker revenue flows

3. **Third:** Wise
   - Useful for broader international transfer support

4. **Last:** PayPal
   - More complex and less practical for early-stage products

**Important rule:** Always ask first: "Is this country supported, and under what terms?" This saves time and avoids wasted engineering effort.

---

## Practical Notes

Before contacting each provider, prepare:

- Business overview
- Product demo or live link
- User flow explanation
- Region and compliance notes
- Expected transaction volume
- Technical integration plan

This makes your pitch more credible and speeds up onboarding.

---

## Final Recommendation

For an early-stage product like RavonPay, the best first step is to prioritize local and international payout partners that are easiest to integrate and support the actual user problem.

The most valuable path is:

- local wallet support via Payme/Click
- international payouts via Payoneer
- then expansion with Wise and additional financial infrastructure

This creates the strongest path from MVP to real fintech business.
