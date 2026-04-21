import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { broadcast } from '@/lib/wsBroadcast'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

    const checkins = await prisma.checkin.findMany({
      where: { date },
      include: { restaurant: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(checkins)
  } catch (e) {
    console.error(e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const { restaurantId, username } = await req.json()

    if (!restaurantId || !username) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
    }

    const date = new Date().toISOString().slice(0, 10)

    await prisma.checkin.deleteMany({ where: { username, date } })

    const checkin = await prisma.checkin.create({
      data: { restaurantId, username, date },
      include: { restaurant: true },
    })
    broadcast({ type: 'checkins_changed' })
    return NextResponse.json(checkin, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '체크인 실패' }, { status: 500 })
  }
}
