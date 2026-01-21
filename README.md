# Calibrated

<!-- TODO: Add logo screenshot here -->

An estimation game app for testing your calibration. Create questions, share links with friends, collect guesses, and reveal results.

**Live at [calibrated.vercel.app](https://calibrated.vercel.app)**

## Features

- Create estimation questions with optional true answers
- Share question links for others to submit guesses
- Optional min/max bounds to constrain guesses
- Two-phase reveal: show guesses first, then the answer
- Public question feed or private link-only access
- Password protection for questions
- Number line visualization of guesses and answers

## Tech Stack

- Next.js 16 (App Router)
- Supabase (Postgres + Auth)
- Tailwind CSS + shadcn/ui
- Vercel

## Local Development

```bash
pnpm install
pnpm dev
```

See `CLAUDE.md` for detailed project context and patterns.
