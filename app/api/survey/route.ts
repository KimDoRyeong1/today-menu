import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scoreRestaurant, SurveyAnswers } from '@/lib/scoring'

export async function POST(req: Request) {
  try {
    const answers: SurveyAnswers = await req.json()
    const restaurants = await prisma.restaurant.findMany()
    const scored = restaurants
      .map((r) => ({ ...r, score: scoreRestaurant(r, answers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
    return NextResponse.json(scored)
  } catch (e) {
    console.error(e)
    return NextResponse.json([], { status: 200 })
  }
}
