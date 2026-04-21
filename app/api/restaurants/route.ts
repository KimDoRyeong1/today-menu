import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: [{ isBase: 'desc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(restaurants)
  } catch (e) {
    console.error(e)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, category, menus, price, priceLevel, rating, lat, lng, hours, phone, satiety, speed, occasion, naverUrl, naverPlaceId } = body

    if (!name || !lat || !lng) {
      return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 })
    }

    const restaurant = await prisma.restaurant.create({
      data: { name, category, menus: menus ?? [], price: price ?? '', priceLevel: priceLevel ?? 2, rating: rating ?? 0, lat, lng, hours, phone, satiety: satiety ?? 'medium', speed: speed ?? 'normal', occasion: occasion ?? 'meal', naverUrl, naverPlaceId },
    })
    return NextResponse.json(restaurant, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: '등록 실패' }, { status: 500 })
  }
}
