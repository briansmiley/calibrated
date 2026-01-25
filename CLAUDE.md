# Calibrated - Claude Context

> **Maintenance**: Update this file when making significant changes (new features, schema changes, new patterns, etc.).

## Project Overview
A zero-friction estimation game. Users create questions with a number range and answer, share the link, others click on a number line to guess, then reveal results. No accounts required.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (Postgres)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Hosting**: Vercel
- **Icons**: react-icons (FaLock, FaLockOpen, FaPlus), lucide-react

## Key URLs
- Production: https://calibrated.vercel.app
- Supabase project: zxaxpoerzsgeomaqjbsc
- Discord bot install: https://calibrated.vercel.app/discord

## Database Schema
Two main tables for the simple question mode (see `supabase/migrations/` for full schema):

**simple_questions**
- id (UUID), title, description (optional)
- min_value, max_value, true_answer
- reveal_pin (optional 6-digit PIN to protect reveal)
- revealed (boolean)
- created_at

**simple_guesses**
- id (UUID), question_id, value
- created_at

### RLS Security Model
- Fully open tables - anyone can read/write
- No authentication required
- Anon key is safe to expose

## Git Workflow
- **Do not push directly to main** unless explicitly discussed for a given feature
- Create feature branches and open PRs for review
- Branch naming: `feature/description` or `fix/description`

## Routes
- `/` - Home page with logo and "Create Question" button
- `/create` - Create a new question (title, range, answer, optional PIN)
- `/q/[id]` - View question, submit guesses, reveal answer
- `/api/discord/interactions` - Discord bot webhook endpoint

## Important Patterns

### Short IDs
Questions use the first 7 characters of their UUID as the URL identifier. The `get_simple_question_by_prefix` RPC function handles prefix matching.

### Number Line Interaction
- Users click on the number line to submit a guess (no form needed)
- Hover shows a ghost dot preview
- After guessing, users see "Guess recorded!" with option to guess again
- Realtime subscription updates when others guess

### PIN Protection
- Optional 6-digit PIN can protect the reveal
- Auto-generated when lock is enabled
- Wrong PIN shows error styling on input

### Optimistic Updates
Guesses are added to the UI immediately after successful insert, before the realtime subscription confirms.

### Discord Bot
A Discord bot allows creating and participating in questions directly in Discord:
- `/calibrate` slash command creates a question and posts it to the channel
- "Guess" button opens a modal for submitting guesses
- Interactions are verified using `discord-interactions` library
- Requires `DISCORD_PUBLIC_KEY` environment variable

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_APP_URL=https://calibrated.vercel.app (or http://localhost:3000)
DISCORD_PUBLIC_KEY=xxx (for Discord bot signature verification)
```

## Local Development
```bash
pnpm dev             # Start dev server
pnpm build           # Build for production
supabase start       # Start local Supabase (if using local instance)
```

## Testing

### E2E Tests (Playwright)
Tests are in the `/e2e` directory.

```bash
pnpm test:e2e        # Run all e2e tests (headless)
pnpm test:e2e:ui     # Run tests with Playwright UI
pnpm test:e2e:headed # Run tests in headed browser mode
```

**Test Coverage:**
- `/e2e/simple-questions.spec.ts` - Question creation, guessing, and reveal flows

## File Structure
- `/src/app/page.tsx` - Home page
- `/src/app/(main)/create/page.tsx` - Question creation form
- `/src/app/(main)/q/[id]/page.tsx` - Question view page
- `/src/app/(main)/q/[id]/SimpleNumberLine.tsx` - Interactive number line component
- `/src/app/api/discord/interactions/route.ts` - Discord bot webhook handler
- `/src/components/Header.tsx` - Simple header with logo and "New Question" link
- `/src/components/CalibratedLogo.tsx` - Logo wordmark component
- `/src/lib/supabase/client.ts` - Supabase browser client
- `/src/lib/supabase/server.ts` - Supabase server client
