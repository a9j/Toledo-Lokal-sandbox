# ToledoLokal

Local business and community platform for Toledo, Ohio.

## Stack

- React 18 + TypeScript + Vite (port 8080)
- Tailwind CSS + shadcn-ui (Radix UI primitives)
- Supabase (auth, database, edge functions, storage)
- React Router for client-side routing (70+ routes, lazy-loaded)
- React Query for server state
- PWA with service workers

## Project Structure

- `src/pages/` — Route pages (lazy-loaded except Today.tsx)
- `src/components/` — UI components organized by feature
- `src/components/ui/` — shadcn-ui base components
- `src/hooks/` — Custom React hooks (data fetching, feature logic)
- `src/contexts/` — AuthContext (role-based), SubscriptionContext, LoopContext
- `src/integrations/supabase/` — Supabase client + auto-generated types
- `src/lib/` — Utilities, validation schemas, config
- `supabase/functions/` — Edge functions (Deno)
- `supabase/migrations/` — SQL migrations

## Commands

```
npm run dev       # Dev server at localhost:8080
npm run build     # Production build
npm run lint      # ESLint
```

## Key Patterns

- Auth roles: resident, business, admin, organizer, nonprofit, partner, connector
- Path alias: `@/` maps to `src/`
- Env vars prefixed with `VITE_` for client-side access
- Supabase types are auto-generated in `src/integrations/supabase/types.ts` — do not edit manually
- Design tokens: "lokal" color palette (midnight, amber, terracotta, forest) in tailwind.config.ts
- Fonts: DM Sans (body), Space Grotesk (headings)
