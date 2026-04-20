export type SurveyAnswers = {
  mood: 'light' | 'medium' | 'heavy'
  budget: 1 | 2 | 3
  category: string
  party: 'solo' | 'small' | 'large'
  time: 'fast' | 'normal' | 'slow'
}

export type ScoredRestaurant = {
  id: number
  name: string
  category: string
  menus: string[]
  price: string
  priceLevel: number
  rating: number
  lat: number
  lng: number
  hours: string | null
  phone: string | null
  satiety: string
  speed: string
  score: number
}

export function scoreRestaurant(
  restaurant: { satiety: string; priceLevel: number; category: string; speed: string },
  answers: SurveyAnswers
): number {
  let score = 0

  // 기분 ↔ 포만감 (25점)
  if (restaurant.satiety === answers.mood) {
    score += 25
  } else {
    score += 8
  }

  // 예산 (25점)
  if (restaurant.priceLevel <= answers.budget) {
    score += 25
  } else if (restaurant.priceLevel - answers.budget === 1) {
    score += 10
  } else {
    score += 5
  }

  // 카테고리 (25점)
  if (answers.category === '상관없음' || restaurant.category === answers.category) {
    score += 25
  } else {
    score += 5
  }

  // 속도 (20점)
  if (restaurant.speed === answers.time) {
    score += 20
  } else {
    score += 7
  }

  return Math.min(score, 100)
}
