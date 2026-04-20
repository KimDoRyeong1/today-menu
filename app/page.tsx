'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SurveyTab from '@/components/SurveyTab'
import RegisterTab from '@/components/RegisterTab'
import GoingTab from '@/components/GoingTab'

const MapTab = dynamic(() => import('@/components/MapTab'), { ssr: false })

type Restaurant = {
  id: number
  name: string
  category: string
  menus: string[]
  price: string
  hours: string | null
  phone: string | null
  lat: number
  lng: number
  satiety: string
  speed: string
}

type Checkin = {
  id: number
  restaurantId: number
  username: string
  restaurant: Restaurant
}

type Tab = 'map' | 'survey' | 'register' | 'going'

const TABS = [
  { id: 'map', label: '🗺️ 지도' },
  { id: 'survey', label: '🎯 추천' },
  { id: 'register', label: '➕ 등록' },
  { id: 'going', label: '👥 누가가나' },
] as const

export default function Home() {
  const [tab, setTab] = useState<Tab>('map')
  const [username, setUsername] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [highlightIds, setHighlightIds] = useState<number[]>([])
  const [toast, setToast] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const fetchRestaurants = useCallback(async () => {
    try {
      const res = await fetch('/api/restaurants')
      if (!res.ok) return
      const data = await res.json()
      setRestaurants(Array.isArray(data) ? data : [])
    } catch {}
  }, [])

  const fetchCheckins = useCallback(async () => {
    try {
      const res = await fetch(`/api/checkins?date=${today}`)
      if (!res.ok) return
      const data = await res.json()
      setCheckins(Array.isArray(data) ? data : [])
    } catch {}
  }, [today])

  useEffect(() => {
    const saved = localStorage.getItem('lunchapp_name')
    if (saved) setUsername(saved)
    fetchRestaurants()
    fetchCheckins()
  }, [fetchRestaurants, fetchCheckins])

  // 30초 폴링
  useEffect(() => {
    const id = setInterval(fetchCheckins, 30000)
    return () => clearInterval(id)
  }, [fetchCheckins])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function saveName() {
    if (!nameInput.trim()) return
    localStorage.setItem('lunchapp_name', nameInput.trim())
    setUsername(nameInput.trim())
  }

  async function handleCheckin(restaurantId: number) {
    if (!username) return showToast('이름을 먼저 설정해주세요')
    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, username }),
    })
    fetchCheckins()
    showToast('체크인 완료! 🙋')
  }

  async function handleCheckout(checkinId: number) {
    await fetch(`/api/checkins/${checkinId}`, { method: 'DELETE' })
    fetchCheckins()
    showToast('체크아웃 완료')
  }

  function handleRandomLunch() {
    if (restaurants.length === 0) return
    const picks = [...restaurants].sort(() => Math.random() - 0.5).slice(0, 3)
    setHighlightIds(picks.map((r) => r.id))
    setTab('map')
    showToast(`오늘의 추천: ${picks.map((r) => r.name).join(', ')} 🎲`)
  }

  function goToMapRestaurant(restaurantId: number) {
    setHighlightIds([restaurantId])
    setTab('map')
  }

  if (!username) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <p className="text-4xl mb-4">🍱</p>
        <h1 className="text-2xl font-bold mb-2">오늘 뭐드세요?</h1>
        <p className="text-gray-500 mb-8 text-sm">이름을 입력하면 시작됩니다</p>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            className="flex-1 border rounded-xl px-3 py-2"
            placeholder="이름 입력"
            autoFocus
          />
          <button onClick={saveName} className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold">
            시작
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col max-w-md mx-auto bg-white shadow-sm">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <h1 className="font-bold text-lg">오늘 뭐드세요? 🍱</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomLunch}
            className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold"
          >
            오늘점심 🎲
          </button>
          <span className="text-sm text-gray-500">{username}</span>
        </div>
      </header>

      {/* 탭 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {tab === 'map' && (
          <MapTab
            restaurants={restaurants}
            checkins={checkins}
            username={username}
            onCheckin={handleCheckin}
            onCheckout={handleCheckout}
            highlightIds={highlightIds}
          />
        )}
        {tab === 'survey' && <SurveyTab onGoToMap={goToMapRestaurant} />}
        {tab === 'register' && <RegisterTab onRegistered={() => { fetchRestaurants(); showToast('식당 등록 완료! ✅') }} />}
        {tab === 'going' && (
          <GoingTab
            checkins={checkins}
            username={username}
            onCheckin={handleCheckin}
            onCheckout={handleCheckout}
          />
        )}
      </main>

      {/* 하단 탭바 */}
      <nav className="flex border-t bg-white">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${tab === t.id ? 'text-orange-500 border-t-2 border-orange-500 -mt-px' : 'text-gray-400'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
