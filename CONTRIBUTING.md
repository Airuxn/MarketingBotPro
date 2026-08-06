# Contributing to MarketingBot Pro

**This project is abandoned.** The maintainer does not actively develop new features. Contributions are limited to:

- Documentation corrections
- Security fixes
- Dependency updates that restore CI
- Typo and clarity improvements

## Before you start

- Read [README.md](README.md) and [SECURITY.md](SECURITY.md).
- Search [existing issues](https://github.com/Airuxn/MarketingBotPro/issues).
- Do **not** open public issues for credential leaks — rotate keys and see SECURITY.md.

## Development setup

**Requirements:** Node.js 20+ (see `.nvmrc`)

```bash
git clone https://github.com/Airuxn/MarketingBotPro.git
cd MarketingBotPro
npm install
cp .env.example .env.local
npm run type-check
npm run lint
npm run dev
```

Full OAuth setup: [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md)

## Pull requests

1. Fork and branch from `main`.
2. Scope PRs narrowly — one fix per PR for abandoned projects.
3. Run `npm run type-check` and `npm run lint` before opening.
4. Never commit `.env`, `.env.local`, or API keys.

## Commit messages

```
fix: Correct OAuth callback URL in docs
docs: Note abandoned status in SETUP.md
```

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
