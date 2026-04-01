# Primeform

Track your Face, Physic, and Brain daily. Become your Prime Form.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Postgres / Supabase session pooler
- Groq for optional daily coaching analysis
- Capacitor-ready config for iOS and Android wrappers

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `DATABASE_URL`: Supabase session pooler connection string
- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase publishable/anon key for Auth and RLS-backed data access
- `GROQ_API_KEY`: Groq API key
- `GROQ_MODEL`: defaults to `openai/gpt-oss-20b`
- `CAPACITOR_SERVER_URL`: hosted HTTPS URL for native wrappers

## Development

```bash
npm install
npm run dev
```

## Database

Run the SQL in `supabase/schema.sql` against your Supabase project after setting the database password in `DATABASE_URL`.

Primeform now uses Supabase Auth cookie sessions for sign in and sign up. The app loads and saves data for the authenticated user only.

## Native

This repo is set up for a hosted-web Capacitor flow. After deploying the web app:

```bash
export CAPACITOR_SERVER_URL=https://your-deployed-app.example.com
npx cap add ios
npx cap add android
npx cap sync
```
