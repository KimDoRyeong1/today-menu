'use client'

import { useState, useEffect, useCallback } from 'react'
import { CAT_EMOJI } from '@/lib/constants'

type Restaurant = { id: number; name: string; category: string }

type Props = {
  picks: Restaurant[]
  onConfirm: () => void
}

// /public/memes/ 폴더에 이미지를 넣으면 여기에 파일명을 추가하세요
// 예: '/memes/muhan1.jpg', '/memes/lunch_meme.gif'
const LOCAL_MEMES: string[] = [
  // '/memes/muhan1.jpg',
]

// Giphy API key (선택) — https://developers.giphy.com 에서 발급
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY ?? ''
const GIPHY_TAGS = ['무한도전 밥', '배고파', '점심 먹자', '맛있겠다', 'hungry funny']

async function fetchGif(): Promise<string | null> {
  if (!GIPHY_API_KEY) return null
  try {
    const tag = GIPHY_TAGS[Math.floor(Math.random() * GIPHY_TAGS.length)]
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(tag)}&limit=20&rating=g&lang=ko`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    const items: Array<{ images: { downsized: { url: string }; fixed_height: { url: string } } }> = json.data ?? []
    if (!items.length) return null
    const pick = items[Math.floor(Math.random() * items.length)]
    return pick.images.downsized?.url ?? pick.images.fixed_height?.url ?? null
  } catch {
    return null
  }
}

export default function LunchRevealModal({ picks, onConfirm }: Props) {
  const [phase, setPhase] = useState<'searching' | 'reveal'>('searching')
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [dotCount, setDotCount] = useState(1)

  const loadImage = useCallback(async () => {
    // 1. 로컬 이미지 우선
    if (LOCAL_MEMES.length) {
      setGifUrl(LOCAL_MEMES[Math.floor(Math.random() * LOCAL_MEMES.length)])
      return
    }
    // 2. Giphy (API 키 설정 시)
    const url = await fetchGif()
    setGifUrl(url)
  }, [])

  useEffect(() => {
    loadImage()
    const timer = setTimeout(() => setPhase('reveal'), 2800)
    return () => clearTimeout(timer)
  }, [loadImage])

  // 점(.) 애니메이션
  useEffect(() => {
    if (phase !== 'searching') return
    const id = setInterval(() => setDotCount(d => (d % 3) + 1), 420)
    return () => clearInterval(id)
  }, [phase])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
    >
      <style>{`
        @keyframes pop-in {
          0%   { opacity:0; transform:scale(0.4) translateY(24px); }
          70%  { transform:scale(1.08) translateY(-4px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes spin-in {
          from { opacity:0; transform:rotate(-10deg) scale(0.7); }
          to   { opacity:1; transform:rotate(0) scale(1); }
        }
      `}</style>

      {phase === 'searching' ? (
        /* ── 결정 중 화면 ── */
        <div className="flex flex-col items-center gap-5 px-6 text-center">
          {gifUrl ? (
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{ width: 280, height: 200, border: '4px solid #FF5722', animation: 'spin-in 0.5s ease' }}
            >
              <img src={gifUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <img src="/loading.gif" alt="" className="w-48 h-48 object-contain" style={{ animation: 'pop-in 0.5s ease' }} />
          )}

          <div>
            <p className="text-white text-xl font-bold">이봐! 오늘 점심</p>
            <p className="text-orange-400 text-3xl font-black mt-1">
              결정 중{'.'.repeat(dotCount)}
            </p>
          </div>

          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 bg-orange-400 rounded-full"
                style={{ animation: `bounce 0.7s ease ${i * 0.13}s infinite alternate` }}
              />
            ))}
          </div>
        </div>
      ) : (
        /* ── 결과 공개 화면 ── */
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-xs">
          <p className="text-4xl" style={{ animation: 'pop-in 0.4s ease' }}>🎉</p>
          <img
            src="/lunch_issue.jpeg"
            alt="오늘의 점심 후보"
            className="w-full rounded-2xl shadow-xl"
            style={{ animation: 'pop-in 0.4s ease 0.05s both' }}
          />

          <div className="w-full flex flex-col gap-3">
            {picks.map((r, i) => (
              <div
                key={r.id}
                className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-xl"
                style={{ animation: `pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + i * 0.1}s both` }}
              >
                <span className="text-3xl shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{r.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {CAT_EMOJI[r.category] ?? '🍽️'} {r.category}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onConfirm}
            className="mt-1 bg-orange-500 text-white font-bold px-8 py-3.5 rounded-full text-base shadow-lg active:scale-95 transition-transform"
            style={{ animation: `pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) ${0.1 + picks.length * 0.1}s both` }}
          >
            지도에서 확인! 🗺️
          </button>
        </div>
      )}
    </div>
  )
}
