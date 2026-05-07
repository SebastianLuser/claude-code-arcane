---
name: email-template-builder
description: "Build complete transactional email systems with React Email templates, multi-provider integration, i18n, dark mode, spam optimization, and analytics tracking for Resend, Postmark, SendGrid, or AWS SES."
category: "backend"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Email Template Builder

Build complete transactional email systems: React Email templates, provider integration, preview server, i18n support, dark mode, spam optimization, and analytics tracking.

> **Note:** This skill may create or modify files in your project. It will ask before writing.

## Core Capabilities

- React Email templates (welcome, verification, password reset, invoice, notification, digest)
- MJML templates for maximum email client compatibility
- Multi-provider support with unified sending interface
- Local preview server with hot reload
- i18n/localization with typed translation keys
- Dark mode support using media queries
- Spam score optimization checklist
- Open/click tracking with UTM parameters

## When to Use

- Setting up transactional email for a new product
- Migrating from a legacy email system
- Adding new email types (invoice, digest, notification)
- Debugging email deliverability issues
- Implementing i18n for email templates

## Project Structure

```
emails/
├── components/
│   ├── layout/
│   │   ├── email-layout.tsx       # Base layout with brand header/footer
│   │   └── email-button.tsx       # CTA button component
│   ├── partials/
│   │   ├── header.tsx
│   │   └── footer.tsx
├── templates/
│   ├── welcome.tsx
│   ├── verify-email.tsx
│   ├── password-reset.tsx
│   ├── invoice.tsx
│   ├── notification.tsx
│   └── weekly-digest.tsx
├── lib/
│   ├── send.ts                    # Unified send function
│   ├── providers/
│   │   ├── resend.ts
│   │   ├── postmark.ts
│   │   └── ses.ts
│   └── tracking.ts                # UTM + analytics
├── i18n/
│   ├── en.ts
│   └── de.ts
└── preview/                       # Dev preview server
    └── server.ts
```

## Spam Score Optimization Checklist

- [ ] Sender domain has SPF, DKIM, and DMARC records configured
- [ ] From address uses your own domain (not gmail.com/hotmail.com)
- [ ] Subject line under 50 characters, no ALL CAPS, no "FREE!!!"
- [ ] Text-to-image ratio: at least 60% text
- [ ] Plain text version included alongside HTML
- [ ] Unsubscribe link in every marketing email (CAN-SPAM, GDPR)
- [ ] No URL shorteners -- use full branded links
- [ ] No red-flag words: "guarantee", "no risk", "limited time offer" in subject
- [ ] Single CTA per email -- no 5 different buttons
- [ ] Image alt text on every image
- [ ] HTML validates -- no broken tags
- [ ] Test with Mail-Tester.com before first send (target: 9+/10)

## Common Pitfalls

- **Inline styles required** -- most email clients strip `<head>` styles; React Email handles this
- **Max width 600px** -- anything wider breaks on Gmail mobile
- **No flexbox/grid** -- use `<Row>` and `<Column>` from react-email, not CSS grid
- **Dark mode media queries** -- must use `!important` to override inline styles
- **Missing plain text** -- all major providers have a plain text field; always populate it
- **Transactional vs marketing** -- use separate sending domains/IPs to protect deliverability

## Templates and Code

> See references/react-email-templates.md for complete implementation code covering base layout, welcome email, invoice email, unified send function, i18n, analytics tracking, and preview server setup.
