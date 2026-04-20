import { NextResponse } from 'next/server'
import { sendTeamsWebhook } from '@/lib/teams'

export async function POST(req: Request) {
  const { webhookUrl, ...payload } = await req.json()

  const url = webhookUrl || process.env.TEAMS_WEBHOOK_URL
  if (!url) {
    return NextResponse.json({ error: 'Webhook URL 없음' }, { status: 400 })
  }

  await sendTeamsWebhook(url, payload)
  return NextResponse.json({ ok: true })
}
