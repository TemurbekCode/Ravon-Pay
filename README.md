# RavonPay

**The simplest way for Central Asian freelancers, dropshippers, and remote workers to receive international payments.**

[![Status](https://img.shields.io/badge/status-in%20development-blue)](https://github.com)
[![Region](https://img.shields.io/badge/region-Central%20Asia-green)](https://github.com)
[![Language](https://img.shields.io/badge/lang-EN%20%7C%20UZ-orange)](https://github.com)

---

## What is RavonPay?

RavonPay is a fintech platform designed to solve international payment challenges for Central Asian freelancers, dropshippers, and remote workers.

The goal is to help users find the easiest, most practical payment route without dealing with confusing or unreliable international payment systems.

---

## The Problem

- PayPal does not work reliably in Central Asia
- Payoneer is confusing and difficult for many users
- SWIFT is expensive and slow
- Many users do not understand which payment method is best for their situation
- There is limited guidance in local languages

---

## The Solution

RavonPay focuses on three core things:

1. **AI Payment Adviser** — Users answer a few questions and receive a recommendation on the best payment option
2. **Step-by-Step Guides** — Clear instructions for each payment method
3. **Centralized Information** — Trusted, easy-to-understand information about international payment tools

---

## Who Is It For?

| User Type | Use Case |
|-----------|----------|
| 💻 Freelancers | Upwork, Fiverr, direct international clients |
| 📦 Dropshippers | Amazon, Shopify, eBay |
| 🌍 Remote Workers | International employers |
| 🎮 Content Creators | YouTube, Twitch, Patreon |
| 📱 App Developers | App Store, Google Play |
| 🎓 Online Educators | Udemy, Teachable |
| 🏢 Small Businesses | B2B and international clients |

---

## Tech Stack

### Frontend
- React + Vite
- SCSS
- Axios
- React Router

### Backend
- Node.js + Express
- libSQL (Turso)
- JWT for authentication
- bcryptjs for password hashing
- Helmet for security headers
- Rate limiting for API protection

### Deployment
- Frontend: Netlify
- Backend: Render or Railway
- Database: Turso

---

## Project Structure

```text
ravon-pay/
├── index.html
├── src/
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── utils/
│   └── App.jsx
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── db.js
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── services/
│   └── package.json
├── package.json
├── vite.config.js
├── README.md
└── LICENSE
```

---

## Security Note

⚠️ This project is an early-stage fintech product and is not production-ready for live financial operations.

Before real-world deployment, the following must be addressed:

- HTTPS everywhere
- Proper backend validation for all transactions
- Payment processing through a trusted provider
- PCI compliance for any card handling
- Strong authentication and authorization
- Rate limiting and monitoring
- KYC / AML review where required
- Audit logs for transactions and user actions
- Secure storage for sensitive data
- Regulatory review for each target region

This project is a product prototype and concept platform, not a complete production payment system by itself.

---

## Roadmap

### Phase 1 — MVP
- [x] Landing page (EN + UZ)
- [ ] AI Payment Adviser tool
- [ ] Payoneer guide
- [ ] Wise guide
- [ ] Skrill guide

### Phase 2 — Expansion
- [ ] User accounts and dashboard
- [ ] Transaction history
- [ ] Kazakhstan and Kyrgyzstan support
- [ ] Mobile app

### Phase 3 — Full Platform
- [ ] Banking partnerships
- [ ] Full Central Asian payment platform
- [ ] Uzbekistan, Kazakhstan, Kyrgyzstan, Tajikistan support
- [ ] Regulatory compliance and licensing

---

## Installation

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm start
```

The backend runs at:

```text
http://localhost:4000/api/v1
```

---

## Environment Variables

Create a `.env` file in the backend and add your required configuration:

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
JWT_SECRET=your-secret-key
```

---

## Deployment

### Frontend (Netlify)

```bash
npm run build
```

Deploy the generated `dist/` folder to Netlify.

### Backend (Render / Railway)

1. Push the `backend/` folder to GitHub
2. Create a new web service on Render or Railway
3. Set environment variables from `.env.example`
4. Start with `npm start`

---

## Demo Account

A demo CEO account is created automatically in the backend for testing.

- Email: `ceo@ravonpay.uz`
- Password: any password for demo access

This is intended for development and demo purposes only.

---

## Contributing

RavonPay is a proprietary project and is not open for external contributions at this stage.

---

## License

**Proprietary License** — All rights reserved.

This repository is for internal product development and demonstration purposes only.

---

## Contact

- Email: hello@ravonpay.com
- GitHub: [@TemurbekCode](https://github.com/TemurbekCode)

---

<p align="center">
  🌊 <strong>RavonPay</strong> — International payments, simplified.
  <br>
  <em>Making fintech accessible for Central Asia</em>
</p>
