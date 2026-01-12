# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.

Contact the maintainer privately via GitHub Security Advisories or direct message.

## Security Model

MarketingBot Pro is designed as a **single-user** marketing automation tool:

- OAuth client secrets and server-side API keys belong in environment variables (`.env.local`, never committed).
- Social media access tokens and the Gemini API key are stored in the browser (`localStorage`) for the connected user session.
- API routes reject cross-origin requests in production to prevent open-proxy abuse.

## Before Deploying to Production

1. Set all OAuth credentials in your hosting provider's environment variables.
2. Never commit `.env`, `.env.local`, or backup env files.
3. Rotate OAuth app secrets if they were ever exposed locally or in logs.
4. Keep dependencies updated (`npm audit`).

## Recommended Hardening for Multi-Tenant Use

This codebase is not multi-tenant ready out of the box. For shared or public deployments, consider:

- Server-side session authentication
- Encrypted server-side token storage
- Rate limiting on API routes
- Moving Gemini API calls fully server-side
