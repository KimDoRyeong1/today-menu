'use client'

import { useState } from 'react'
import { CATEGORIES } from '@/lib/constants'

type Props = {
  onRegistered: () => void
}

export default function RegisterTab({ onRegistered }: Props) {
  const [form, setForm] = useState({
    name: '',
    category: '한식',
    menus: [''],
    price: '',
    priceLevel: 2,
    hours: '',
    phone: '',
    lat: '',
    lng: '',
    satiety: 'medium',
    speed: 'normal',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addMenu() {
    setForm((f) => ({ ...f, menus: [...f.menus, ''] }))
  }

  function setMenu(i: number, val: string) {
    setForm((f) => {
      const menus = [...f.menus]
      menus[i] = val
      return { ...f, menus }
    })
  }

  function removeMenu(i: number) {
    setForm((f) => ({ ...f, menus: f.menus.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.lat || !form.lng) {
      setError('식당명, 위도, 경도는 필수입니다.')
      return
    }
    setLoading(true)
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        menus: form.menus.filter(Boolean),
        lat: Number(form.lat),
        lng: Number(form.lng),
        priceLevel: Number(form.priceLevel),
      }),
    })
    setLoading(false)
    if (res.ok) {
      onRegistered()
      setForm({ name: '', category: '한식', menus: [''], price: '', priceLevel: 2, hours: '', phone: '', lat: '', lng: '', satiety: 'medium', speed: 'normal' })
    } else {
      setError('등록에 실패했습니다.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 overflow-y-auto h-full space-y-4">
      <h2 className="font-bold text-lg">식당 등록 ➕</h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <label className="block">
        <span className="text-sm font-medium text-gray-700">식당명 *</span>
        <input value={form.name} onChange={(e) => set('name', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="식당 이름" />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">카테고리</span>
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm">
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </label>

      <div>
        <span className="text-sm font-medium text-gray-700">메뉴</span>
        {form.menus.map((m, i) => (
          <div key={i} className="flex gap-2 mt-1">
            <input value={m} onChange={(e) => setMenu(i, e.target.value)} className="flex-1 border rounded-xl px-3 py-2 text-sm" placeholder={`메뉴 ${i + 1}`} />
            {form.menus.length > 1 && <button type="button" onClick={() => removeMenu(i)} className="text-red-400 px-2">✕</button>}
          </div>
        ))}
        <button type="button" onClick={addMenu} className="mt-1 text-sm text-orange-500">+ 메뉴 추가</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">가격</span>
          <input value={form.price} onChange={(e) => set('price', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="9,000~12,000원" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">가격대</span>
          <select value={form.priceLevel} onChange={(e) => set('priceLevel', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm">
            <option value={1}>저렴</option>
            <option value={2}>보통</option>
            <option value={3}>비쌈</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">포만감</span>
          <select value={form.satiety} onChange={(e) => set('satiety', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm">
            <option value="light">가벼움</option>
            <option value="medium">보통</option>
            <option value="heavy">든든함</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">식사속도</span>
          <select value={form.speed} onChange={(e) => set('speed', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm">
            <option value="fast">빠름</option>
            <option value="normal">보통</option>
            <option value="slow">느림</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">영업시간</span>
        <input value={form.hours} onChange={(e) => set('hours', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="11:00~21:00" />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">전화번호</span>
        <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="02-0000-0000" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">위도 *</span>
          <input value={form.lat} onChange={(e) => set('lat', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="37.4985" />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">경도 *</span>
          <input value={form.lng} onChange={(e) => set('lng', e.target.value)} className="mt-1 block w-full border rounded-xl px-3 py-2 text-sm" placeholder="127.0280" />
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl disabled:opacity-50"
      >
        {loading ? '등록 중...' : '식당 등록하기'}
      </button>
    </form>
  )
}
