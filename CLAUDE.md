# Calibrated - Claude Context

> **Maintenance**: Update this file when making significant changes (new features, schema changes, new patterns, etc.).

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
- min_value, max_value (optional bounds for guesses)
- is_public (show in public feed), password (optional access protection)
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
pnpm dev             # Start dev server
pnpm build           # Build for production
pnpm db:seed         # Seed local database with test data
supabase start       # Start local Supabase (if using local instance)
```

For OAuth testing locally with production Supabase, temporarily change Site URL in Supabase dashboard to `http://localhost:3000`.

## Testing

### E2E Tests (Playwright)
The project uses Playwright for end-to-end testing. Tests are in the `/e2e` directory.

```bash
npm run test:e2e        # Run all e2e tests (headless)
npm run test:e2e:ui     # Run tests with Playwright UI
npm run test:e2e:headed # Run tests in headed browser mode
npm run test:e2e:debug  # Debug tests step-by-step
npm run test:report     # View HTML test report
```

**Test Setup Requirements:**
1. Start local Supabase: `supabase start`
2. Seed test data: `npm run db:seed` (if seed script exists)
3. Ensure test users exist (alice@example.com, bob@example.com with password: password123)

**Test Structure:**
- `/e2e/fixtures/` - Test utilities, helpers, and fixtures
- `/e2e/auth.spec.ts` - Authentication tests
- `/e2e/questions.spec.ts` - Question creation and viewing
- `/e2e/guesses.spec.ts` - Guess submission and validation
- `/e2e/results.spec.ts` - Results page and number line
- `/e2e/dashboard.spec.ts` - Dashboard functionality
- `/e2e/feed.spec.ts` - Public feed and password protection

**Running Specific Tests:**
```bash
npm run test:e2e -- e2e/auth.spec.ts        # Run only auth tests
npm run test:e2e -- --grep "login"           # Run tests matching "login"
```

**Pre-PR Checklist:**
Before opening a PR, ensure all relevant tests pass:
1. Run the full test suite: `npm run test:e2e`
2. If adding new features, add corresponding tests
3. Review test report for any failures: `npm run test:report`

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
