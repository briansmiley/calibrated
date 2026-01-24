import { verifyKey } from 'discord-interactions'
import { createQuestion, getQuestion, submitGuess } from '@/lib/services/questions'

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://calibrated.vercel.app'

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3
const MODAL_SUBMIT = 5

// Discord response types
const PONG = 1
const CHANNEL_MESSAGE = 4
const MODAL = 9

// Discord message flags
const SUPPRESS_EMBEDS = 4
const EPHEMERAL = 64

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

    // Build response message - question title is a link
    const lines = [`[**${options.question}**](${url})`]
    if (options.description) {
      lines.push('', `Details: ${options.description}`)
    }

    // Format range with units
    let rangeText: string
    if (options.unit && options.currency) {
      rangeText = `${options.unit}${options.min} – ${options.unit}${options.max}`
    } else if (options.unit) {
      rangeText = `${options.min} – ${options.max} ${options.unit}`
    } else {
      rangeText = `${options.min} – ${options.max}`
    }
    lines.push('', `Range: ${rangeText}`)

    return Response.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: lines.join('\n'),
        flags: SUPPRESS_EMBEDS,
        components: [{
          type: 1, // Action row
          components: [{
            type: 2, // Button
            style: 1, // Primary (blue)
            label: "Guess",
            custom_id: `guess_${result.data.shortId}`
          }]
        }]
      }
    })
  }

  // Handle button click (Guess button)
  if (interaction.type === MESSAGE_COMPONENT) {
    const customId = interaction.data.custom_id as string
    if (customId.startsWith('guess_')) {
      const questionId = customId.replace('guess_', '')

      // Fetch question details
      const questionResult = await getQuestion(questionId)
      if (!questionResult.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: "❌ Question not found",
            flags: EPHEMERAL
          }
        })
      }

      const q = questionResult.data.question

      // Get user's display name
      const displayName = interaction.member?.nick
        || interaction.member?.user?.global_name
        || interaction.member?.user?.username
        || ''

      // Format range with units
      let rangeText: string
      if (q.unit && q.isCurrency) {
        rangeText = `${q.unit}${q.minValue} – ${q.unit}${q.maxValue}`
      } else if (q.unit) {
        rangeText = `${q.minValue} – ${q.maxValue} ${q.unit}`
      } else {
        rangeText = `${q.minValue} – ${q.maxValue}`
      }

      // Modal title (45 char limit) - truncate question if needed
      const modalTitle = q.title.length > 45 ? q.title.slice(0, 42) + '...' : q.title

      const components = [
        // Guess input with range in label
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: "guess_value",
            label: `Your Guess (${rangeText})`,
            style: 1,
            required: true,
            placeholder: "Enter a number"
          }]
        },
        // Name input
        {
          type: 1,
          components: [{
            type: 4,
            custom_id: "guess_name",
            label: "Name (optional)",
            style: 1,
            required: false,
            value: displayName
          }]
        }
      ]

      return Response.json({
        type: MODAL,
        data: {
          custom_id: `submit_${questionId}`,
          title: modalTitle,
          components
        }
      })
    }
  }

  // Handle modal submit
  if (interaction.type === MODAL_SUBMIT) {
    const customId = interaction.data.custom_id as string
    if (customId.startsWith('submit_')) {
      const questionId = customId.replace('submit_', '')

      // Extract form values
      const fields = interaction.data.components.flatMap(
        (row: { components: Array<{ custom_id: string; value: string }> }) => row.components
      )
      const valueStr = fields.find((f: { custom_id: string }) => f.custom_id === 'guess_value')?.value
      const name = fields.find((f: { custom_id: string }) => f.custom_id === 'guess_name')?.value

      const value = parseFloat(valueStr || '')
      if (isNaN(value)) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: "❌ Please enter a valid number",
            flags: EPHEMERAL
          }
        })
      }

      const result = await submitGuess({ questionId, value, name: name || undefined })

      if (!result.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: `❌ ${result.error}`,
            flags: EPHEMERAL
          }
        })
      }

      return Response.json({
        type: CHANNEL_MESSAGE,
        data: {
          content: `✓ Guess recorded: ${value}`,
          flags: EPHEMERAL
        }
      })
    }
  }

  return Response.json({ error: 'Unknown interaction' }, { status: 400 })
}
