'use client'

import { useState } from 'react'
import { SurveyAnswers } from '@/lib/scoring'

type ScoredRestaurant = {
  id: number
  name: string
  category: string
  menus: string[]
  price: string
  score: number
}

type Props = {
  onGoToMap: (restaurantId: number) => void
}

const STEPS = [
  {
    key: 'mood',
    question: '오늘 기분은?',
    options: [
      { value: 'light', label: '🥗', title: '가볍게', desc: '샐러드, 쌀국수' },
      { value: 'medium', label: '🍱', title: '보통', desc: '일반 한 끼' },
      { value: 'heavy', label: '🍖', title: '든든하게', desc: '고기, 탕류' },
    ],
  },
  {
    key: 'budget',
    question: '예산은?',
    options: [
      { value: 1, label: '💚', title: '1만원 이하', desc: '가성비' },
      { value: 2, label: '💛', title: '1~1.5만원', desc: '적당히' },
      { value: 3, label: '❤️', title: '1.5만원+', desc: '특별한 날' },
    ],
  },
  {
    key: 'category',
    question: '음식 종류는?',
    options: [
      { value: '한식', label: '🍲', title: '한식', desc: '' },
      { value: '일식', label: '🍱', title: '일식', desc: '' },
      { value: '중식', label: '🥡', title: '중식', desc: '' },
      { value: '양식', label: '🍝', title: '양식', desc: '' },
      { value: '분식', label: '🥢', title: '분식', desc: '' },
      { value: '베트남', label: '🍜', title: '베트남', desc: '' },
      { value: '상관없음', label: '🎲', title: '상관없어요', desc: '' },
    ],
  },
  {
    key: 'party',
    question: '몇 명이서?',
    options: [
      { value: 'solo', label: '🧍', title: '혼자', desc: '' },
      { value: 'small', label: '👥', title: '2~4명', desc: '' },
      { value: 'large', label: '👨‍👩‍👧‍👦', title: '5명+', desc: '' },
    ],
  },
  {
    key: 'time',
    question: '식사 시간은?',
    options: [
      { value: 'fast', label: '⚡', title: '빠르게', desc: '30분 이내' },
      { value: 'normal', label: '🍽️', title: '여유롭게', desc: '1시간' },
      { value: 'slow', label: '☕', title: '천천히', desc: '맛집 탐방' },
    ],
  },
]

export default function SurveyTab({ onGoToMap }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({})
  const [results, setResults] = useState<ScoredRestaurant[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSelect(value: unknown) {
    const newAnswers = { ...answers, [STEPS[step].key]: value }
    setAnswers(newAnswers)

    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      setLoading(true)
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnswers),
      })
      const data = await res.json()
      setResults(data)
      setLoading(false)
    }
  }

  function reset() {
    setStep(0)
    setAnswers({})
    setResults(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <svg className="animate-spin w-8 h-8 text-orange-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm">추천 식당 찾는 중...</p>
      </div>
    )
  }

  if (results) {
    return (
      <div className="scrollable h-full px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">추천 결과 🎯</h2>
          <button onClick={reset} className="text-sm text-orange-500 font-medium py-1 px-3 rounded-full bg-orange-50">
            다시하기
          </button>
        </div>
        <div className="space-y-3 pb-4">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onGoToMap(r.id)}
              className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.category} · {r.price}</p>
                  </div>
                </div>
                <span className="font-bold text-orange-500 text-lg shrink-0">{r.score}점</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${r.score}%` }} />
              </div>
              <div className="flex flex-wrap gap-1">
                {r.menus.slice(0, 4).map((m) => (
                  <span key={m} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const current = STEPS[step]
  const isGrid = current.options.length > 4
  const isOdd = current.options.length % 2 !== 0

  return (
    <div className="scrollable h-full px-4 py-4">
      {/* 진행바 */}
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-orange-400' : 'bg-gray-200'}`} />
        ))}
      </div>

      <h2 className="text-xl font-bold mb-5">{current.question}</h2>

      <div className={isGrid ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
        {current.options.map((opt, idx) => (
          <button
            key={String(opt.value)}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-left active:scale-[0.97] transition-transform
              ${isGrid && isOdd && idx === current.options.length - 1 ? 'col-span-2' : ''}`}
          >
            <span className="text-2xl">{opt.label}</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm">{opt.title}</p>
              {opt.desc && <p className="text-xs text-gray-400">{opt.desc}</p>}
            </div>
          </button>
        ))}
      </div>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-5 text-sm text-gray-400 flex items-center gap-1"
        >
          ← 이전
        </button>
      )}
    </div>
  )
}
