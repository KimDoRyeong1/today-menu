'use client'

import { useEffect, useRef, useState } from 'react'
import { CAT_COLOR, CAT_EMOJI, DEFAULT_CENTER } from '@/lib/constants'

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
}

type Checkin = {
  id: number
  restaurantId: number
  username: string
  restaurant: Restaurant
}

type Props = {
  restaurants: Restaurant[]
  checkins: Checkin[]
  username: string
  onCheckin: (restaurantId: number) => void
  onCheckout: (checkinId: number) => void
  highlightIds?: number[]
}

export default function MapTab({ restaurants, checkins, username, onCheckin, onCheckout, highlightIds = [] }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<Record<number, import('leaflet').Marker>>({})
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
      const map = L.map(mapRef.current!, { zoomControl: false }).setView(DEFAULT_CENTER, 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
      }).addTo(map)
      // 줌 컨트롤을 오른쪽 하단으로
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      mapInstanceRef.current = map
    })
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current!
      Object.values(markersRef.current).forEach((m) => m.remove())
      markersRef.current = {}

      restaurants.forEach((r) => {
        const checkinCount = checkins.filter((c) => c.restaurantId === r.id).length
        const isHighlighted = highlightIds.includes(r.id)
        const color = CAT_COLOR[r.category] ?? '#607D8B'
        const emoji = CAT_EMOJI[r.category] ?? '🍽️'

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="position:relative;display:inline-block">
              <div style="
                background:${color};border-radius:50%;width:40px;height:40px;
                display:flex;align-items:center;justify-content:center;
                font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,0.25);
                ${isHighlighted ? 'animation:bounce 0.5s infinite alternate;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);' : ''}
              ">${emoji}</div>
              ${checkinCount > 0 ? `<div style="position:absolute;top:-4px;right:-4px;background:#FF5722;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:1.5px solid #fff">${checkinCount}</div>` : ''}
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })

        const marker = L.marker([r.lat, r.lng], { icon }).addTo(map)
        marker.on('click', () => setSelectedRestaurant(r))
        markersRef.current[r.id] = marker
      })

      if (highlightIds.length > 0) {
        const highlighted = restaurants.filter((r) => highlightIds.includes(r.id))
        if (highlighted.length > 0) {
          const bounds = L.latLngBounds(highlighted.map((r) => [r.lat, r.lng]))
          map.fitBounds(bounds, { padding: [80, 80] })
        }
      }
    })
  }, [restaurants, checkins, highlightIds])

  const myCheckin = checkins.find((c) => c.username === username)
  const checkinMembers = selectedRestaurant
    ? checkins.filter((c) => c.restaurantId === selectedRestaurant.id)
    : []

  return (
    <div className="relative h-full">
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}`}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />

      {/* 바텀시트 백드롭 */}
      {selectedRestaurant && (
        <div
          className="bottom-sheet-backdrop"
          onClick={() => setSelectedRestaurant(null)}
        />
      )}

      {/* 식당 팝업 */}
      {selectedRestaurant && (
        <div
          className="bottom-sheet absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1000] flex flex-col"
          style={{ maxHeight: '75dvh', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          {/* 핸들 */}
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex justify-between items-start px-5 pb-3 shrink-0">
            <div>
              <h3 className="font-bold text-lg leading-tight">{selectedRestaurant.name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{selectedRestaurant.category} · {selectedRestaurant.price}</p>
            </div>
            <button
              onClick={() => setSelectedRestaurant(null)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm shrink-0"
            >
              ✕
            </button>
          </div>

          {/* 스크롤 영역 */}
          <div className="scrollable flex-1 px-5">
            {/* 메뉴 칩 */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedRestaurant.menus.slice(0, 5).map((m) => (
                <span key={m} className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full font-medium">{m}</span>
              ))}
            </div>

            {/* 부가정보 */}
            <div className="text-xs text-gray-400 mb-3 space-y-1">
              {selectedRestaurant.hours && <p>🕐 {selectedRestaurant.hours}</p>}
              {selectedRestaurant.phone && <p>📞 {selectedRestaurant.phone}</p>}
            </div>

            {/* 체크인 멤버 */}
            {checkinMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {checkinMembers.map((c) => (
                  <span key={c.id} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                    {c.username}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 체크인/아웃 버튼 */}
          <div className="px-5 pt-2 shrink-0">
            {myCheckin?.restaurantId === selectedRestaurant.id ? (
              <button
                onClick={() => { onCheckout(myCheckin.id); setSelectedRestaurant(null) }}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-base active:scale-[0.98] transition-transform"
              >
                체크아웃
              </button>
            ) : (
              <button
                onClick={() => { onCheckin(selectedRestaurant.id); setSelectedRestaurant(null) }}
                className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-semibold text-base active:scale-[0.98] transition-transform"
              >
                나도 갈래! 🙋
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
