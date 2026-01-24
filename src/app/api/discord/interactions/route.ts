import { verifyKey } from 'discord-interactions'
import { createQuestion } from '@/lib/services/questions'

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://calibrated.vercel.app'

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2

// Discord response types
const PONG = 1
const CHANNEL_MESSAGE = 4

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature-ed25519')
  const timestamp = request.headers.get('x-signature-timestamp')

  // Verify request is from Discord
  if (!signature || !timestamp) {
    return new Response('Missing signature headers', { status: 401 })
  }

  const isValid = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY)
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  const interaction = JSON.parse(body)

  // Handle PING (Discord verification when setting endpoint URL)
  if (interaction.type === PING) {
    return Response.json({ type: PONG })
  }

  // Handle slash command
  if (interaction.type === APPLICATION_COMMAND && interaction.data.name === 'calibrate') {
    const options = Object.fromEntries(
      interaction.data.options?.map((o: { name: string; value: string | number }) => [o.name, o.value]) || []
    )

    const result = await createQuestion({
      title: options.question as string,
      description: options.description as string | undefined,
      minValue: options.min as number,
      maxValue: options.max as number,
      trueAnswer: options.answer as number,
      revealPin: options.pin as string | undefined,
      unit: options.unit as string | undefined,
      isCurrency: options.currency as boolean | undefined,
    })

    if (!result.success) {
      return Response.json({
        type: CHANNEL_MESSAGE,
        data: {
          content: `❌ Error: ${result.error}`,
          flags: 64 // Ephemeral - only visible to command user
        }
      })
    }

    const url = `${APP_URL}/q/${result.data.shortId}`

    // Build response message
    const lines = [`**${options.question}**`]
    if (options.description) {
      lines.push('', `Details: ${options.description}`)
    }
    lines.push('', `Range: ${options.min} – ${options.max}`)
    lines.push('', `[Guess Here](${url})`)

    return Response.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: lines.join('\n'),
      }
    })
  }

  return Response.json({ error: 'Unknown interaction' }, { status: 400 })
}
