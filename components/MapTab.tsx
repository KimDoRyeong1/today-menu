'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
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
  const mapInstanceRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<Record<number, naver.maps.Marker>>({})
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [mapReady, setMapReady] = useState(false)

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = new naver.maps.Map(mapRef.current, {
      center: new naver.maps.LatLng(DEFAULT_CENTER[0], DEFAULT_CENTER[1]),
      zoom: 16,
      zoomControl: true,
      zoomControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
    })
    mapInstanceRef.current = map
    setMapReady(true)
  }

  // naver script가 이미 로드돼 있는 경우(탭 전환 등)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.naver?.maps && !mapInstanceRef.current) {
      initMap()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return
    const map = mapInstanceRef.current

    Object.values(markersRef.current).forEach((m) => m.setMap(null))
    markersRef.current = {}

    restaurants.forEach((r) => {
      const checkinCount = checkins.filter((c) => c.restaurantId === r.id).length
      const isHighlighted = highlightIds.includes(r.id)
      const color = CAT_COLOR[r.category] ?? '#607D8B'
      const emoji = CAT_EMOJI[r.category] ?? '🍽️'

      const content = `<div style="
          position:relative;width:24px;height:24px;border-radius:50%;
          background:${isHighlighted ? color : '#fff'};
          border:2px solid ${color};
          display:flex;align-items:center;justify-content:center;
          font-size:12px;line-height:1;cursor:pointer;
          box-shadow:${isHighlighted ? '0 0 0 4px ' + color + '30,0 2px 6px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.18)'};
          ${isHighlighted ? 'animation:pin-pulse 1.2s ease-in-out infinite;' : ''}
        ">${emoji}${checkinCount > 0 ? `<div style="position:absolute;top:-5px;right:-5px;background:#FF5722;color:#fff;border-radius:9px;min-width:14px;height:14px;font-size:8px;line-height:14px;text-align:center;font-weight:700;border:1.5px solid #fff;padding:0 2px;box-sizing:border-box">${checkinCount}</div>` : ''}</div>`

      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(r.lat, r.lng),
        map,
        icon: { content, anchor: new naver.maps.Point(12, 12) },
      })
      naver.maps.Event.addListener(marker, 'click', () => setSelectedRestaurant(r))
      markersRef.current[r.id] = marker
    })

    if (highlightIds.length > 0) {
      const highlighted = restaurants.filter((r) => highlightIds.includes(r.id))
      if (highlighted.length > 0) {
        const bounds = highlighted.reduce(
          (b, r) => b.extend(new naver.maps.LatLng(r.lat, r.lng)),
          new naver.maps.LatLngBounds(
            new naver.maps.LatLng(highlighted[0].lat, highlighted[0].lng),
            new naver.maps.LatLng(highlighted[0].lat, highlighted[0].lng),
          ),
        )
        map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 })
      }
    }
  }, [restaurants, checkins, highlightIds, mapReady])

  const myCheckin = checkins.find((c) => c.username === username)
  const checkinMembers = selectedRestaurant
    ? checkins.filter((c) => c.restaurantId === selectedRestaurant.id)
    : []

  return (
    <div className="relative h-full">
      <style>{`@keyframes pin-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}`}</style>
      <Script
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} className="w-full h-full" />

      {selectedRestaurant && (
        <div className="bottom-sheet-backdrop" onClick={() => setSelectedRestaurant(null)} />
      )}

      {selectedRestaurant && (
        <div
          className="bottom-sheet absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[1000] flex flex-col"
          style={{ maxHeight: '75dvh', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        >
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

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

          <div className="scrollable flex-1 px-5">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedRestaurant.menus.slice(0, 5).map((m) => (
                <span key={m} className="bg-orange-50 text-orange-600 text-xs px-2.5 py-1 rounded-full font-medium">{m}</span>
              ))}
            </div>

            <div className="text-xs text-gray-400 mb-3 space-y-1">
              {selectedRestaurant.hours && <p>🕐 {selectedRestaurant.hours}</p>}
              {selectedRestaurant.phone && <p>📞 {selectedRestaurant.phone}</p>}
            </div>

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

          <div className="px-5 pt-2 shrink-0 flex flex-col gap-2">
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
            <a
              href={`https://map.naver.com/p/directions/-/-/${selectedRestaurant.lng},${selectedRestaurant.lat},${encodeURIComponent(selectedRestaurant.name)}/walk`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-green-500 text-white font-semibold text-base text-center active:scale-[0.98] transition-transform block"
            >
              🗺️ 길찾기
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
