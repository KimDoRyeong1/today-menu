import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const restaurant = await prisma.restaurant.update({
    where: { id: Number(id) },
    data: body,
  })
  return NextResponse.json(restaurant)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await prisma.restaurant.delete({ where: { id: Number(id) } })
  return NextResponse.json({ ok: true })
}
