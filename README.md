# MarketingBot Pro

Next.js PWA for AI-assisted marketing automation — content generation (Google Gemini), social scheduling, email campaigns, lead tracking, and analytics.

**Status:** abandoned · **Stack:** Next.js 14 · TypeScript · [MIT](LICENSE)

[![CI](https://github.com/Airuxn/MarketingBotPro/actions/workflows/ci.yml/badge.svg)](https://github.com/Airuxn/MarketingBotPro/actions/workflows/ci.yml)

**Quality:** CI (test, lint, typecheck, build) · CodeQL · Dependabot (Actions only) · Vercel waits for CI + CodeQL on `main`

> **No longer maintained.** Archived; kept public as reference architecture. Some features may be incomplete or broken. Use at your own discretion. PRs for critical fixes welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## What it was

Single-user marketing automation tool:

- AI content generation with style learning from edits and scanned posts
- Multi-platform scheduling (Twitter, LinkedIn, Facebook, Instagram)
- Email campaigns with tone and language options
- Lead management and engagement analytics
- OAuth connectors for social accounts

Architecture and setup details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · [docs/SETUP.md](docs/SETUP.md) · [docs/QUICKSTART.md](docs/QUICKSTART.md)

Historical full manual: [COMPLETE_MANUAL.html](COMPLETE_MANUAL.html) (legacy, not updated)

---

## Quick start (local)

**Requirements:** Node.js 20+ (see [.nvmrc](.nvmrc))

```bash
git clone https://github.com/Airuxn/MarketingBotPro.git
cd MarketingBotPro
npm install
cp .env.example .env.local
# Fill OAuth + GEMINI_API_KEY in .env.local — never commit
npm run dev
```

Open `http://localhost:3000`. Production deploy notes: [DEPLOY_TO_VERCEL.md](DEPLOY_TO_VERCEL.md)

---

## Environment

Copy [`.env.example`](.env.example) → `.env.local`. Required for full functionality:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini content generation |
| OAuth client IDs/secrets | Twitter, LinkedIn, Facebook, Instagram connectors |

Tokens are stored in browser `localStorage` for the session. Server routes reject cross-origin abuse in production — see [SECURITY.md](SECURITY.md).

---

## Repository layout

| Path | Description |
|------|-------------|
| `app/` | Next.js App Router (frontend + API routes) |
| `components/` | React UI components |
| `lib/` | AI, OAuth, publishing, storage helpers |
| `docs/` | Architecture, OAuth setup, API limits |
| `public/` | PWA manifest and service worker |

---

## Security

OAuth client secrets and server-side API keys belong in environment variables only. Social tokens and Gemini keys stay in the browser session for the connected user.

See [SECURITY.md](SECURITY.md) for deployment guidance and reporting.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) and [React](https://react.dev/) — web framework
- [Google Gemini](https://ai.google.dev/) — AI content generation
- [Vercel](https://vercel.com/) — deployment platform

---

## 📞 Support

For support and questions:

- Create an issue on [GitHub](https://github.com/Airuxn/MarketingBotPro/issues)
- Security: see [SECURITY.md](SECURITY.md)

---

**⭐ If this project helped you, please give it a star!**
