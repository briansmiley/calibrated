import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

// Get local Supabase credentials from `supabase status`
function getLocalSupabaseKey(): string {
  try {
    const output = execSync('supabase status', { encoding: 'utf-8' })
    const match = output.match(/Secret\s+│\s+(sb_secret_\S+)/)
    if (match) return match[1]
  } catch {
    // supabase CLI not available or not running
  }
  throw new Error('Could not get Supabase secret key. Make sure `supabase start` is running.')
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || getLocalSupabaseKey()

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

interface User {
  id: string
  email: string
  name: string
}

const USERS = [
  { email: 'alice@example.com', name: 'alice', password: 'password123' },
  { email: 'bob@example.com', name: 'bob', password: 'password123' },
  { email: 'charlie@example.com', name: 'charlie', password: 'password123' },
  { email: 'diana@example.com', name: 'diana', password: 'password123' },
  { email: 'eve@example.com', name: 'eve', password: 'password123' },
]

async function createUsers(): Promise<User[]> {
  console.log('Creating users...')
  const users: User[] = []

  for (const user of USERS) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === user.email)

    if (existing) {
      console.log(`  User ${user.email} already exists`)
      users.push({ id: existing.id, email: user.email, name: user.name })
      continue
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (error) {
      console.error(`  Error creating ${user.email}:`, error.message)
      continue
    }

    console.log(`  Created ${user.email}`)
    users.push({ id: data.user.id, email: user.email, name: user.name })
  }

  return users
}

async function clearExistingData() {
  console.log('Clearing existing seed data...')

  // Delete guesses first (foreign key constraint)
  await supabase.from('guesses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // Delete questions
  await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('  Cleared existing data')
}

async function seedQuestions(users: User[]) {
  console.log('Creating questions...')

  const [alice, bob, charlie, diana, eve] = users
  if (!alice || !bob) {
    console.error('Need at least alice and bob to seed')
    return
  }

  const questions = [
    // Open question, no guesses yet
    {
      creator_id: alice.id,
      slug: 'jellybeans-jar',
      title: 'How many jellybeans are in this jar?',
      description: 'Standard mason jar filled with assorted jellybeans. Guess the exact count!',
      true_answer: 347,
      unit_type: 'none' as const,
      is_public: true,
      guesses_revealed: false,
      revealed: false,
    },
    // Open question with guesses, guesses hidden
    {
      creator_id: alice.id,
      slug: 'earth-moon-distance',
      title: 'What is the distance from Earth to the Moon in miles?',
      description: 'Average distance, not at perigee or apogee.',
      true_answer: 238900,
      unit_type: 'custom' as const,
      custom_unit: 'miles',
      is_public: true,
      guesses_revealed: false,
      revealed: false,
    },
    // Open question with guesses revealed (but answer not revealed)
    {
      creator_id: bob.id,
      slug: 'movie-budget',
      title: 'What was the production budget of Avatar (2009)?',
      description: 'Just the production budget, not marketing.',
      true_answer: 237000000,
      unit_type: 'currency' as const,
      custom_unit: '$',
      is_public: true,
      guesses_revealed: true,
      revealed: false,
    },
    // Fully revealed question
    {
      creator_id: bob.id,
      slug: 'spotify-songs',
      title: 'How many songs are on Spotify (as of 2024)?',
      description: 'Total number of tracks available on the platform.',
      true_answer: 100000000,
      unit_type: 'none' as const,
      is_public: true,
      guesses_revealed: true,
      revealed: true,
    },
    // Question with min/max bounds
    {
      creator_id: charlie?.id || alice.id,
      slug: 'percentage-guess',
      title: 'What percentage of the ocean has been explored?',
      description: 'Estimated percentage of the ocean floor that has been mapped in detail.',
      true_answer: 5,
      unit_type: 'percentage' as const,
      min_value: 0,
      max_value: 100,
      is_public: true,
      guesses_revealed: false,
      revealed: false,
    },
    // Password protected question
    {
      creator_id: diana?.id || alice.id,
      slug: 'secret-question',
      title: 'How many lines of code in this codebase?',
      description: 'Total lines across all TypeScript/JavaScript files.',
      true_answer: 2500,
      unit_type: 'none' as const,
      is_public: false,
      password: 'secret',
      guesses_revealed: false,
      revealed: false,
    },
    // Private question (no password)
    {
      creator_id: eve?.id || alice.id,
      slug: 'private-poll',
      title: 'How many hours did you sleep last night?',
      description: 'For our friend group sleep study.',
      true_answer: null,
      unit_type: 'custom' as const,
      custom_unit: 'hours',
      is_public: false,
      guesses_revealed: true,
      revealed: false,
    },
    // Question with only min bound
    {
      creator_id: alice.id,
      slug: 'positive-number',
      title: 'How many stars are in the Milky Way (in billions)?',
      description: 'Estimate in billions of stars.',
      true_answer: 200,
      unit_type: 'custom' as const,
      custom_unit: 'billion',
      min_value: 1,
      is_public: true,
      guesses_revealed: false,
      revealed: false,
    },
  ]

  for (const q of questions) {
    const { data, error } = await supabase.from('questions').insert(q).select().single()
    if (error) {
      console.error(`  Error creating "${q.slug}":`, error.message)
    } else {
      console.log(`  Created question: ${q.slug}`)
    }
  }
}

async function seedGuesses(users: User[]) {
  console.log('Creating guesses...')

  const [alice, bob, charlie, diana, eve] = users

  // Get all questions
  const { data: questions } = await supabase.from('questions').select('*')
  if (!questions) return

  const questionMap = Object.fromEntries(questions.map(q => [q.slug, q]))

  const guesses = [
    // Earth-moon distance guesses (hidden)
    { question: 'earth-moon-distance', user: bob, value: 250000 },
    { question: 'earth-moon-distance', user: charlie, value: 220000 },
    { question: 'earth-moon-distance', user: diana, value: 245000 },
    { question: 'earth-moon-distance', user: eve, value: 230000 },

    // Movie budget guesses (revealed guesses)
    { question: 'movie-budget', user: alice, value: 200000000, prior_visible: 0 },
    { question: 'movie-budget', user: charlie, value: 300000000, prior_visible: 1 },
    { question: 'movie-budget', user: diana, value: 250000000, prior_visible: 2 },
    { question: 'movie-budget', user: eve, value: 180000000, prior_visible: 3 },

    // Spotify songs (fully revealed)
    { question: 'spotify-songs', user: alice, value: 80000000 },
    { question: 'spotify-songs', user: bob, value: 120000000 },
    { question: 'spotify-songs', user: charlie, value: 95000000 },
    { question: 'spotify-songs', user: diana, value: 100000000 }, // exact!
    { question: 'spotify-songs', user: eve, value: 75000000 },

    // Percentage guess (with bounds)
    { question: 'percentage-guess', user: bob, value: 20 },
    { question: 'percentage-guess', user: charlie, value: 10 },
    { question: 'percentage-guess', user: diana, value: 3 },

    // Private poll (guesses revealed)
    { question: 'private-poll', user: alice, value: 7 },
    { question: 'private-poll', user: bob, value: 6.5 },
    { question: 'private-poll', user: charlie, value: 8 },

    // Anonymous guesses on jellybeans
    { question: 'jellybeans-jar', user: null, displayName: 'Anonymous', value: 400 },
    { question: 'jellybeans-jar', user: null, displayName: 'GuessMaster', value: 325 },

    // Stars in milky way
    { question: 'positive-number', user: charlie, value: 150 },
    { question: 'positive-number', user: diana, value: 300 },
    { question: 'positive-number', user: eve, value: 250 },
  ]

  for (const g of guesses) {
    const question = questionMap[g.question]
    if (!question) {
      console.error(`  Question not found: ${g.question}`)
      continue
    }

    const guess = {
      question_id: question.id,
      user_id: g.user?.id || null,
      display_name: g.displayName || g.user?.name || 'Anonymous',
      value: g.value,
      prior_visible_guesses: g.prior_visible ?? null,
    }

    const { error } = await supabase.from('guesses').insert(guess)
    if (error) {
      console.error(`  Error creating guess on ${g.question}:`, error.message)
    } else {
      console.log(`  Added guess on ${g.question} by ${guess.display_name}: ${g.value}`)
    }
  }
}

async function main() {
  console.log('\n🌱 Seeding database...\n')
  console.log(`Using Supabase at: ${SUPABASE_URL}\n`)

  await clearExistingData()
  const users = await createUsers()

  if (users.length < 2) {
    console.error('\nNeed at least 2 users to seed. Aborting.')
    process.exit(1)
  }

  await seedQuestions(users)
  await seedGuesses(users)

  console.log('\n✅ Seeding complete!\n')
  console.log('Test accounts (password: password123):')
  for (const user of USERS) {
    console.log(`  - ${user.email}`)
  }
  console.log('')
}

main().catch(console.error)
