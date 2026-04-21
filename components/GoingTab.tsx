'use client'

import { CAT_EMOJI } from '@/lib/constants'

type Restaurant = {
  id: number
  name: string
  category: string
}

type Checkin = {
  id: number
  restaurantId: number
  username: string
  restaurant: Restaurant
}

type Props = {
  checkins: Checkin[]
  username: string
  onCheckin: (restaurantId: number) => void
  onCheckout: (checkinId: number) => void
}

export default function GoingTab({ checkins, username, onCheckin, onCheckout }: Props) {
  const myCheckin = checkins.find((c) => c.username === username)

  // 식당별로 그룹화
  const grouped: Record<number, Checkin[]> = {}
  for (const c of checkins) {
    if (!grouped[c.restaurantId]) grouped[c.restaurantId] = []
    grouped[c.restaurantId].push(c)
  }

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <div className="p-4 scrollable h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-bold text-lg">오늘 누가 가나요? 👥</h2>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      {checkins.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="text-sm">아직 아무도 체크인하지 않았어요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([rid, group]) => {
            const r = group[0].restaurant
            const isMyRestaurant = myCheckin?.restaurantId === Number(rid)
            return (
              <div
                key={rid}
                className={`bg-white rounded-2xl shadow p-4 ${isMyRestaurant ? 'ring-2 ring-orange-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CAT_EMOJI[r.category] ?? '🍽️'}</span>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-500">{group.length}명</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.map((c) => (
                    <span
                      key={c.id}
                      className={`text-xs px-2 py-0.5 rounded-full ${c.username === username ? 'bg-orange-100 text-orange-700 font-semibold' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {c.username}
                    </span>
                  ))}
                </div>
                {isMyRestaurant && (
                  <button
                    onClick={() => onCheckout(myCheckin!.id)}
                    className="mt-3 w-full py-1.5 rounded-xl text-sm bg-gray-100 text-gray-600"
                  >
                    체크아웃
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
