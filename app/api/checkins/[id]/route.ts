import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/wsBroadcast'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.checkin.delete({ where: { id: Number(id) } })
  broadcast({ type: 'checkins_changed' })
  return NextResponse.json({ ok: true })
}
