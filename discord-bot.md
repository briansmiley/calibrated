# Discord Bot Setup

## 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application", name it (e.g., "Calibrated")
3. Note your **Application ID** and **Public Key** (General Information page)

## 2. Create Bot & Get Token

1. Go to "Bot" tab → "Add Bot"
2. Click "Reset Token" to get your **Bot Token** (save this - shown only once)
3. Under "Privileged Gateway Intents", you likely don't need any for slash commands

## 3. Register Slash Command

Run this once to register the `/calibrate` command with Discord:

```bash
curl -X POST "https://discord.com/api/v10/applications/YOUR_APP_ID/commands" \
  -H "Authorization: Bot YOUR_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "calibrate",
    "description": "Create a Calibrated estimation question",
    "type": 1,
    "options": [
      {"name": "question", "description": "The question to ask", "type": 3, "required": true},
      {"name": "answer", "description": "The true answer", "type": 10, "required": true},
      {"name": "min", "description": "Minimum value for guesses", "type": 10, "required": true},
      {"name": "max", "description": "Maximum value for guesses", "type": 10, "required": true},
      {"name": "pin", "description": "PIN to protect reveal (optional)", "type": 3, "required": false},
      {"name": "description", "description": "Additional context (optional)", "type": 3, "required": false}
    ]
  }'
```

Option types: `3` = string, `10` = number

## 4. Set Interactions Endpoint

1. In Discord Developer Portal → "General Information"
2. Set **Interactions Endpoint URL** to: `https://calibrated.vercel.app/api/discord/interactions`
3. Discord will ping this endpoint to verify - it must respond correctly (see step 5)

## 5. Create the Endpoint

We need `/api/discord/interactions` to:
- Verify Discord signatures (required)
- Respond to `PING` (type 1) with `PONG`
- Handle slash commands (type 2)

```typescript
// src/app/api/discord/interactions/route.ts
import { verifyKey } from 'discord-interactions'
import { createQuestion } from '@/lib/services/questions'

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY!

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature-ed25519')!
  const timestamp = request.headers.get('x-signature-timestamp')!

  // Verify request is from Discord
  const isValid = verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY)
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  const interaction = JSON.parse(body)

  // Handle PING (Discord verification)
  if (interaction.type === 1) {
    return Response.json({ type: 1 })
  }

  // Handle slash command
  if (interaction.type === 2 && interaction.data.name === 'calibrate') {
    const options = Object.fromEntries(
      interaction.data.options.map((o: any) => [o.name, o.value])
    )

    const result = await createQuestion({
      title: options.question,
      description: options.description,
      minValue: options.min,
      maxValue: options.max,
      trueAnswer: options.answer,
      revealPin: options.pin,
    })

    if (!result.success) {
      return Response.json({
        type: 4,
        data: { content: `Error: ${result.error}`, flags: 64 }
      })
    }

    const url = `https://calibrated.vercel.app/q/${result.data.shortId}`
    return Response.json({
      type: 4,
      data: {
        content: `**${options.question}**\n\nGuess here: ${url}`,
      }
    })
  }

  return Response.json({ error: 'Unknown interaction' }, { status: 400 })
}
```

## 6. Environment Variables

Add to Vercel (and `.env.local`):

```
DISCORD_PUBLIC_KEY=your_public_key_here
DISCORD_BOT_TOKEN=your_bot_token_here  # only needed if doing more than slash commands
DISCORD_APP_ID=your_app_id_here        # only needed for command registration
```

## 7. Install Package

```bash
npm install discord-interactions
```

## 8. Invite Bot to Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes: `applications.commands`
3. Copy URL and open in browser to invite to your server

## Response Types Reference

| Type | Meaning |
|------|---------|
| 1 | PONG (reply to ping) |
| 4 | Channel message with source |
| 5 | Deferred message (for slow operations) |
| 6 | Deferred update (for components) |

Flag `64` makes the response ephemeral (only visible to user who ran command).

## Testing Locally

For local testing, use [ngrok](https://ngrok.com/) to expose localhost:
```bash
ngrok http 3000
```
Then temporarily set the Interactions Endpoint URL to your ngrok URL.
