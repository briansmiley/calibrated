# Calibrated - Claude Context

## Project Overview
An estimation game app where users create questions, share links, collect guesses, and reveal results. Think "guess the number" with social features.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database + Auth**: Supabase (Postgres + built-in auth)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Hosting**: Vercel
- **Icons**: react-icons (FaEye, FcGoogle), lucide-react

## Key URLs
- Production: https://calibrated.vercel.app
- Supabase project: zxaxpoerzsgeomaqjbsc

## Database Schema
Two main tables (see `supabase/schema.sql` for full schema with RLS policies):

**questions**
- id, creator_id, slug (unique URL), title, description
- true_answer (optional), unit_type (none/currency/percentage/custom), custom_unit
- guesses_revealed (show guesses before answer), revealed (fully closed)
- created_at

**guesses**
- id, question_id, user_id (nullable for anonymous), display_name, value
- prior_visible_guesses (tracks if guesser saw other guesses - shown with eye icon)
- created_at

## Auth Flow
- Email/password and Google OAuth supported
- OAuth uses PKCE flow - the callback is client-side (`/auth/callback/page.tsx`) because the PKCE verifier is stored in browser localStorage
- Session may be established via cookies before callback runs, so we check for existing session first

## Important Patterns

### Timestamps
Use `<LocalTime date={timestamp} />` component for user-local timezone display (server renders UTC, client hydrates with local time).

### Unit Formatting
Use `formatValue()` and `getUnitDisplay()` from `@/lib/formatValue.ts` for consistent number formatting with currency/percentage/custom units.

### Two-Phase Reveal
Questions have separate `guesses_revealed` and `revealed` flags:
1. Creator can reveal guesses first (participants see each other's answers)
2. Then reveal the true answer (closes submissions)
3. Or reveal all at once

### RLS Security Model
- Anon key is safe to expose - all security via Row Level Security policies
- Anyone can read questions/guesses
- Only authenticated users create questions (as themselves)
- Only creators can update/delete their questions
- Anyone can submit guesses to unrevealed questions

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_URL=https://calibrated.vercel.app (or http://localhost:3000)
```

See `.env.local.supabase-local` for local Supabase development config.

## Local Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
supabase start       # Start local Supabase (if using local instance)
```

For OAuth testing locally with production Supabase, temporarily change Site URL in Supabase dashboard to `http://localhost:3000`.

## File Structure Highlights
- `/src/app/q/[id]/` - Question pages (public view, admin, results)
- `/src/app/auth/callback/page.tsx` - OAuth callback (client-side for PKCE)
- `/src/components/LocalTime.tsx` - Client-side timestamp formatting
- `/src/lib/supabase/` - Supabase client configs (client.ts, server.ts, middleware.ts)
- `/supabase/schema.sql` - Complete database schema with RLS policies

## Known Quirks
- Next.js 16 shows middleware deprecation warning (can migrate to "proxy" convention later)
- Browser autofill styling requires aggressive CSS overrides (see globals.css)
- Google OAuth "continue to" screen shows Supabase project ID (would need custom domain to fix)
