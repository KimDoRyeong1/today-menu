type TeamsPayload = {
  type: 'checkin' | 'random' | 'survey' | 'test'
  title: string
  text: string
  facts?: { label: string; value: string }[]
}

export async function sendTeamsWebhook(webhookUrl: string, payload: TeamsPayload) {
  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '0076D7',
    summary: payload.title,
    sections: [
      {
        activityTitle: payload.title,
        activityText: payload.text,
        facts: payload.facts ?? [],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card),
  })

  if (!res.ok) throw new Error(`Teams webhook failed: ${res.status}`)
}
