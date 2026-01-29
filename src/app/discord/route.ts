import { redirect } from 'next/navigation'

export function GET() {
  redirect('https://discord.com/oauth2/authorize?client_id=1464382350732558510&permissions=3072&scope=bot+applications.commands')
}
