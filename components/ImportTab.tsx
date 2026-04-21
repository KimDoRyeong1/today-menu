'use client'

import { useState } from 'react'

type Restaurant = {
  id: number
  name: string
  category: string
  menus: string[]
  price: string
  rating: number
  hours: string | null
  naverUrl: string | null
}

type Props = {
  onImported: (restaurant: Restaurant) => void
}

export default function ImportTab({ onImported }: Props) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Restaurant | null>(null)

  async function handleImport() {
    const trimmed = url.trim()
    if (!trimmed) return
    setError('')
    setResult(null)
    setLoading(true)

    const res = await fetch('/api/restaurants/import-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: trimmed }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? '가져오기 실패')
    } else {
      setResult(data)
      setUrl('')
      onImported(data)
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h2 className="font-bold text-lg mb-1">식당 추가 ➕</h2>
      <p className="text-xs text-gray-400 mb-4">네이버 지도 링크를 붙여넣으면 정보를 자동으로 가져옵니다</p>

      <div className="flex flex-col gap-2 mb-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          className="border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-orange-400 transition-colors"
          placeholder="https://naver.me/xxxxx"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="py-3.5 bg-orange-500 text-white font-semibold rounded-2xl disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {loading ? '정보 가져오는 중...' : '식당 추가하기'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          네이버에서 식당 정보를 불러오는 중...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
          <p className="text-green-700 font-semibold mb-2">✅ 식당이 추가됐습니다!</p>
          <div className="text-sm space-y-1 text-gray-700">
            <p className="font-medium text-base">{result.name}</p>
            <p className="text-gray-500">{result.category} · {result.price}</p>
            {result.hours && <p className="text-xs text-gray-400">🕐 {result.hours}</p>}
            {result.menus.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {result.menus.slice(0, 6).map((m) => (
                  <span key={m} className="bg-white text-orange-600 text-xs px-2 py-0.5 rounded-full border border-orange-100">
                    {m}
                  </span>
                ))}
              </div>
            )}
            {result.naverUrl && (
              <a
                href={result.naverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 mt-1 inline-block"
              >
                네이버 지도에서 보기 →
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">사용 방법</p>
        <p>1. 네이버 지도에서 식당 검색</p>
        <p>2. 공유 버튼 → 링크 복사</p>
        <p>3. 위 입력창에 붙여넣기 후 추가</p>
      </div>
    </div>
  )
}
