'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SurveyTab from '@/components/SurveyTab'
import ImportTab from '@/components/ImportTab'
import GoingTab from '@/components/GoingTab'
import LunchRevealModal from '@/components/LunchRevealModal'

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

type Tab = 'map' | 'survey' | 'import' | 'going'

const TABS: { id: Tab; emoji: string; label: string }[] = [
  { id: 'map',    emoji: '🗺️', label: '지도' },
  { id: 'survey', emoji: '🎯', label: '추천' },
  { id: 'import', emoji: '➕', label: '등록' },
  { id: 'going',  emoji: '👥', label: '누가가나' },
]

export default function Home() {
  const [tab, setTab] = useState<Tab>('map')
  const [username, setUsername] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [highlightIds, setHighlightIds] = useState<number[]>([])
  const [lunchPicks, setLunchPicks] = useState<Restaurant[]>([])
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

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'checkins_changed') fetchCheckins()
    }
    ws.onclose = () => {
      // 연결 끊기면 30초 폴링으로 fallback
      const id = setInterval(fetchCheckins, 30000)
      return () => clearInterval(id)
    }
    return () => ws.close()
  }, [fetchCheckins])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function saveName() {
    const name = nameInput.trim()
    if (!name) return
    localStorage.setItem('lunchapp_name', name)
    setUsername(name)
  }

  async function handleCheckin(restaurantId: number) {
    if (!username) return showToast('이름을 먼저 설정해주세요')
    const alreadyCheckedIn = checkins.some((c) => c.username === username)
    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurantId, username }),
    })
    fetchCheckins()
    showToast(alreadyCheckedIn ? '장소를 변경했어요! 🔄' : '체크인 완료! 🙋')
  }

  async function handleCheckout(checkinId: number) {
    await fetch(`/api/checkins/${checkinId}`, { method: 'DELETE' })
    fetchCheckins()
    showToast('체크아웃 완료')
  }

  function handleRandomLunch() {
    if (!restaurants.length) return
    const picks = [...restaurants].sort(() => Math.random() - 0.5).slice(0, 3)
    setLunchPicks(picks)
  }

  function confirmLunchPicks() {
    setHighlightIds(lunchPicks.map((r) => r.id))
    setTab('map')
    showToast(`${lunchPicks.map((r) => r.name).join(', ')} 🎲`)
    setLunchPicks([])
  }

  function goToMapRestaurant(restaurantId: number) {
    setHighlightIds([restaurantId])
    setTab('map')
  }

  /* ── 온보딩 화면 ── */
  if (!username) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-white px-8"
        style={{ height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <p className="text-6xl mb-5">🍱</p>
        <h1 className="text-2xl font-bold mb-1">오늘 뭐드세요?</h1>
        <p className="text-gray-400 mb-10 text-sm">점심 메뉴 고민 해결기</p>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-base outline-none focus:border-orange-400"
            placeholder="이름을 입력하세요"
            autoFocus
          />
          <button
            onClick={saveName}
            className="bg-orange-500 text-white px-5 py-3 rounded-2xl font-semibold text-base active:scale-95 transition-transform"
          >
            시작
          </button>
        </div>
      </div>
    )
  }

  /* ── 메인 화면 ── */
  return (
    <div
      className="flex flex-col bg-white w-full max-w-lg mx-auto"
      style={{ height: '100dvh' }}
    >
      {/* 헤더 */}
      <header
        className="flex items-center justify-between px-4 bg-white border-b border-gray-100 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)', paddingBottom: '10px' }}
      >
        <h1 className="font-bold text-base">오늘 뭐드세요? 🍱</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomLunch}
            className="bg-orange-500 text-white text-xs px-3 py-2 rounded-full font-semibold active:scale-95 transition-transform"
          >
            오늘점심 🎲
          </button>
          <span className="text-sm text-gray-400 max-w-16 truncate">{username}</span>
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
        {tab === 'import' && (
          <ImportTab onImported={() => { fetchRestaurants(); showToast('식당이 추가됐습니다! ✅') }} />
        )}
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
      <nav className="tab-bar flex border-t border-gray-100 bg-white shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors active:opacity-70
              ${tab === t.id ? 'text-orange-500' : 'text-gray-400'}`}
            style={{ minHeight: 52 }}
          >
            <span className="text-xl leading-none">{t.emoji}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* 점심 결정 모달 */}
      {lunchPicks.length > 0 && (
        <LunchRevealModal picks={lunchPicks} onConfirm={confirmLunchPicks} />
      )}

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-sm px-5 py-2.5 rounded-full shadow-xl z-[9999] backdrop-blur-sm"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
