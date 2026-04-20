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
      { value: 'light', label: '🥗 가볍게', desc: '샐러드, 쌀국수' },
      { value: 'medium', label: '🍱 보통', desc: '일반 한 끼' },
      { value: 'heavy', label: '🍖 든든하게', desc: '고기, 탕류' },
    ],
  },
  {
    key: 'budget',
    question: '예산은?',
    options: [
      { value: 1, label: '💚 1만원 이하', desc: '가성비' },
      { value: 2, label: '💛 1~1.5만원', desc: '적당히' },
      { value: 3, label: '❤️ 1.5만원+', desc: '특별한 날' },
    ],
  },
  {
    key: 'category',
    question: '음식 종류는?',
    options: [
      { value: '한식', label: '🍲 한식' },
      { value: '일식', label: '🍱 일식' },
      { value: '중식', label: '🥡 중식' },
      { value: '양식', label: '🍝 양식' },
      { value: '분식', label: '🥢 분식' },
      { value: '베트남', label: '🍜 베트남' },
      { value: '상관없음', label: '🎲 상관없어요' },
    ],
  },
  {
    key: 'party',
    question: '몇 명이서?',
    options: [
      { value: 'solo', label: '🧍 혼자' },
      { value: 'small', label: '👥 2~4명' },
      { value: 'large', label: '👨‍👩‍👧‍👦 5명+' },
    ],
  },
  {
    key: 'time',
    question: '식사 시간은?',
    options: [
      { value: 'fast', label: '⚡ 빠르게', desc: '30분 이내' },
      { value: 'normal', label: '🍽️ 여유롭게', desc: '1시간' },
      { value: 'slow', label: '☕ 천천히', desc: '맛집 탐방' },
    ],
  },
]

export default function SurveyTab({ onGoToMap }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({})
  const [results, setResults] = useState<ScoredRestaurant[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSelect(value: unknown) {
    const key = STEPS[step].key
    const newAnswers = { ...answers, [key]: value }
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
    return <div className="flex items-center justify-center h-full text-gray-500">추천 식당 찾는 중...</div>
  }

  if (results) {
    return (
      <div className="p-4 space-y-3 overflow-y-auto h-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-lg">추천 결과 🎯</h2>
          <button onClick={reset} className="text-sm text-orange-500">다시하기</button>
        </div>
        {results.map((r) => (
          <div
            key={r.id}
            onClick={() => onGoToMap(r.id)}
            className="bg-white rounded-2xl shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <span className="text-xs text-gray-500">{r.category} · {r.price}</span>
              </div>
              <span className="font-bold text-orange-500">{r.score}점</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-orange-400 h-2 rounded-full transition-all" style={{ width: `${r.score}%` }} />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {r.menus.slice(0, 3).map((m) => (
                <span key={m} className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">{m}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const current = STEPS[step]
  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex gap-1 mb-6">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-orange-400' : 'bg-gray-200'}`} />
        ))}
      </div>
      <h2 className="text-xl font-bold mb-6">{current.question}</h2>
      <div className="grid gap-3">
        {current.options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => handleSelect(opt.value)}
            className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow text-left hover:bg-orange-50 hover:shadow-md transition-all"
          >
            <span className="text-lg">{opt.label}</span>
            {'desc' in opt && <span className="text-xs text-gray-400 ml-auto">{opt.desc}</span>}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button onClick={() => setStep(step - 1)} className="mt-4 text-sm text-gray-400 self-start">
          ← 이전
        </button>
      )}
    </div>
  )
}
