# Pharma Q

A B2B multi-vendor pharma marketplace SaaS platform. Every registered business is both a buyer and a seller, each owning its own storefront and inventory.

## Apps

This repo contains three independent Next.js apps sharing one Supabase project:

- **`/`** — Business Dashboard (business.pharmaq.in) — seller-side: products, batch inventory with FIFO expiry deduction, orders received, invoices, wallet, notifications.
- **`controller/`** — Super Admin Controller (controller.pharmaq.in) — business onboarding/approval, catalog moderation, marketing, wallet/credit adjustments, audit logs.
- **`marketplace/`** — Marketplace (pharmaq.in) — buyer storefront, multi-supplier cart, checkout that splits into per-supplier orders, wishlist.

Each app has its own `package.json` and deploys as a separate Vercel project. Set that app's directory as the Vercel project's **Root Directory**.

## Setup

Each app needs a `.env.local` (see `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # controller only — bypasses RLS, keep out of the other two apps
```

Database schema and RLS policies live in `supabase/migrations/*.sql` — run them in order against your Supabase project's SQL Editor.

## Local development

```bash
npm install
npm run dev
```

Run the same in `controller/` and `marketplace/` on different ports.
