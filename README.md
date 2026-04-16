# ToledoLokal

Discover the Glass City — local businesses, events, and community.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, shadcn-ui
- **Backend:** Supabase (Postgres, Auth, Edge Functions, Storage)
- **Deployment:** Vercel
- **PWA:** Offline-capable with service workers

## Getting Started

```sh
# Install dependencies
npm install

# Copy environment variables and fill in your Supabase credentials
cp .env.example .env

# Start the dev server (http://localhost:8080)
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |
| `VITE_SUPABASE_URL` | Supabase project URL |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 8080 |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Deployment

This project deploys to **Vercel**. Connect your GitHub repo in the Vercel dashboard — it will auto-detect Vite and configure the build.

**Build settings** (auto-detected by Vercel):
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Set the environment variables from `.env.example` in your Vercel project settings.

## Supabase

Edge functions live in `supabase/functions/`. Database migrations are in `supabase/migrations/`.

To work with Supabase locally, install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run:

```sh
supabase start
supabase functions serve
```
