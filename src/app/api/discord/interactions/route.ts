import { verifyKey } from 'discord-interactions'
import { createQuestion, getQuestion, submitGuess, revealAnswer } from '@/lib/services/questions'

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://calibrated.live'

// Discord interaction types
const PING = 1
const APPLICATION_COMMAND = 2
const MESSAGE_COMPONENT = 3
const MODAL_SUBMIT = 5

// Discord response types
const PONG = 1
const CHANNEL_MESSAGE = 4
const UPDATE_MESSAGE = 7
const MODAL = 9

// Discord message flags
const SUPPRESS_EMBEDS = 4
const EPHEMERAL = 64

// Helper to format the revealed message with spoiler text
function formatRevealedMessage(
  question: {
    title: string
    description: string | null
    minValue: number
    maxValue: number
    trueAnswer: number | null
    unit: string | null
    isCurrency: boolean
  },
  guesses: Array<{ value: number; name: string | null }>,
  shortId: string
): string {
  const url = `${APP_URL}/q/${shortId}`
  const lines = [`[**${question.title}**](${url})`]

  if (question.description) {
    lines.push('', `Details: ${question.description}`)
  }

  // Format range with units
  let rangeText: string
  if (question.unit && question.isCurrency) {
    rangeText = `${question.unit}${question.minValue} – ${question.unit}${question.maxValue}`
  } else if (question.unit) {
    rangeText = `${question.minValue} – ${question.maxValue} ${question.unit}`
  } else {
    rangeText = `${question.minValue} – ${question.maxValue}`
  }
  lines.push('', `Range: ${rangeText}`)

  // Add spoilered results
  lines.push('', '**Tap to reveal answer:**')

  const spoilerLines: string[] = []

  // Format answer with units
  let answerText: string
  if (question.unit && question.isCurrency) {
    answerText = `${question.unit}${question.trueAnswer}`
  } else if (question.unit) {
    answerText = `${question.trueAnswer} ${question.unit}`
  } else {
    answerText = `${question.trueAnswer}`
  }
  spoilerLines.push(`✓ Answer: ${answerText}`)

  if (guesses.length > 0 && question.trueAnswer !== null) {
    spoilerLines.push('')
    // Sort by distance from answer
    const sorted = [...guesses].sort(
      (a, b) => Math.abs(a.value - question.trueAnswer!) - Math.abs(b.value - question.trueAnswer!)
    )
    sorted.forEach((g, i) => {
      const name = g.name || 'Anonymous'
      const star = i === 0 ? ' ⭐' : ''
      spoilerLines.push(`${i + 1}. ${name} (${g.value})${star}`)
    })
  } else if (guesses.length === 0) {
    spoilerLines.push('', 'No guesses yet!')
  }

  lines.push(`||${spoilerLines.join('\n')}||`)

  return lines.join('\n')
}

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

    const hasPin = !!options.pin

    return Response.json({
      type: CHANNEL_MESSAGE,
      data: {
        content: lines.join('\n'),
        flags: SUPPRESS_EMBEDS,
        components: [{
          type: 1, // Action row
          components: [
            {
              type: 2, // Button
              style: 1, // Primary (blue)
              label: "Guess",
              custom_id: `guess_${result.data.shortId}`
            },
            {
              type: 2, // Button
              style: 2, // Secondary (gray)
              label: hasPin ? "Reveal 🔒" : "Reveal",
              custom_id: `reveal_${result.data.shortId}`
            }
          ]
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

    // Handle Reveal button
    if (customId.startsWith('reveal_')) {
      const questionId = customId.replace('reveal_', '')

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

      // If already revealed, just show the results (update message)
      if (q.revealed) {
        const content = formatRevealedMessage(
          { ...q, trueAnswer: q.trueAnswer },
          questionResult.data.guesses,
          q.shortId
        )

        return Response.json({
          type: UPDATE_MESSAGE,
          data: {
            content,
            flags: SUPPRESS_EMBEDS,
            components: [{
              type: 1,
              components: [
                {
                  type: 2,
                  style: 1,
                  label: "Guess",
                  custom_id: `guess_${q.shortId}`
                }
              ]
            }]
          }
        })
      }

      // If has PIN, show modal to enter PIN
      if (q.hasPin) {
        return Response.json({
          type: MODAL,
          data: {
            custom_id: `revealpin_${questionId}`,
            title: "Enter PIN to Reveal",
            components: [{
              type: 1,
              components: [{
                type: 4,
                custom_id: "pin_value",
                label: "PIN",
                style: 1,
                required: true,
                placeholder: "Enter the 6-character PIN",
                max_length: 6
              }]
            }]
          }
        })
      }

      // No PIN - reveal directly
      const revealResult = await revealAnswer({ questionId })
      if (!revealResult.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: `❌ ${revealResult.error}`,
            flags: EPHEMERAL
          }
        })
      }

      // Re-fetch to get updated state with guesses
      const updatedResult = await getQuestion(questionId)
      if (!updatedResult.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: "❌ Failed to fetch results",
            flags: EPHEMERAL
          }
        })
      }

      const updated = updatedResult.data
      const content = formatRevealedMessage(
        { ...updated.question, trueAnswer: revealResult.data.trueAnswer },
        updated.guesses,
        updated.question.shortId
      )

      return Response.json({
        type: UPDATE_MESSAGE,
        data: {
          content,
          flags: SUPPRESS_EMBEDS,
          components: [{
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: "Guess",
                custom_id: `guess_${updated.question.shortId}`
              }
            ]
          }]
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

    // Handle PIN reveal modal
    if (customId.startsWith('revealpin_')) {
      const questionId = customId.replace('revealpin_', '')

      // Extract PIN value
      const fields = interaction.data.components.flatMap(
        (row: { components: Array<{ custom_id: string; value: string }> }) => row.components
      )
      const pin = fields.find((f: { custom_id: string }) => f.custom_id === 'pin_value')?.value

      const revealResult = await revealAnswer({ questionId, pin: pin?.toLowerCase() })
      if (!revealResult.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: `❌ ${revealResult.error}`,
            flags: EPHEMERAL
          }
        })
      }

      // Fetch updated question with guesses
      const updatedResult = await getQuestion(questionId)
      if (!updatedResult.success) {
        return Response.json({
          type: CHANNEL_MESSAGE,
          data: {
            content: "❌ Failed to fetch results",
            flags: EPHEMERAL
          }
        })
      }

      const updated = updatedResult.data
      const content = formatRevealedMessage(
        { ...updated.question, trueAnswer: revealResult.data.trueAnswer },
        updated.guesses,
        updated.question.shortId
      )

      return Response.json({
        type: UPDATE_MESSAGE,
        data: {
          content,
          flags: SUPPRESS_EMBEDS,
          components: [{
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: "Guess",
                custom_id: `guess_${updated.question.shortId}`
              }
            ]
          }]
        }
      })
    }
  }

  return Response.json({ error: 'Unknown interaction' }, { status: 400 })
}
