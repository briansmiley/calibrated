<img width="354" height="89" alt="image" src="https://github.com/user-attachments/assets/6f6cd2d3-3b1d-4399-91de-82d7f8164f18" />

A zero-friction estimation game for testing calibration.

**Live at [calibrated.live](https://calibrated.live)**

## How It Works

1. **Create a question** - Ask something with a numeric answer (e.g., "How many bones in the human body?")
2. **Set the answer** - Enter the true value
3. **Set the range** - Define min and max bounds for guesses
4. **Share the link** - Send it to friends
5. **Collect guesses** - Others click on the number line to guess
6. **Reveal the answer** - See how everyone did (optionally protect reveal with a PIN)

## Discord Bot

[Add to your server](https://calibrated.live/discord)

Uses the `/calibrate` slash command.

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Postgres)
- Tailwind CSS + shadcn/ui
- Vercel

## Local Development

### Quick Start (using production Supabase)

```bash
pnpm install
cp .env.example .env.local  # Add your Supabase credentials
pnpm dev
```

### Full Local Setup (with local Supabase)

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli)

2. Start local Supabase:
   ```bash
   supabase start
   ```
   This spins up a local Postgres database, Auth, and API. Note the `anon key` and `API URL` from the output.

3. Configure environment:
   ```bash
   cp .env.local.supabase-local .env.local
   ```
   Or manually set:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start>
   ```

4. Run migrations:
   ```bash
   supabase db reset
   ```

5. Start the dev server:
   ```bash
   pnpm dev
   ```

### Useful Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
supabase start        # Start local Supabase
supabase stop         # Stop local Supabase
supabase db reset     # Reset DB and run all migrations
supabase migration new <name>  # Create new migration
```

See `CLAUDE.md` for detailed project context and patterns.
