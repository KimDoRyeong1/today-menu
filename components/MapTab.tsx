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
      // Fix default icon
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView(DEFAULT_CENTER, 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)
      mapInstanceRef.current = map
    })
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current!

      // 기존 마커 제거
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
                background:${color};border-radius:50%;width:36px;height:36px;
                display:flex;align-items:center;justify-content:center;
                font-size:18px;box-shadow:0 2px 6px rgba(0,0,0,0.3);
                ${isHighlighted ? 'animation:bounce 0.6s infinite alternate;border:3px solid #fff;' : ''}
              ">${emoji}</div>
              ${checkinCount > 0 ? `<div style="position:absolute;top:-4px;right:-4px;background:#FF5722;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;display:flex;align-items:center;justify-content:center;font-weight:bold">${checkinCount}</div>` : ''}
            </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })

        const marker = L.marker([r.lat, r.lng], { icon }).addTo(map)
        marker.on('click', () => setSelectedRestaurant(r))
        markersRef.current[r.id] = marker
      })

      if (highlightIds.length > 0) {
        const highlighted = restaurants.filter((r) => highlightIds.includes(r.id))
        if (highlighted.length > 0) {
          const bounds = L.latLngBounds(highlighted.map((r) => [r.lat, r.lng]))
          map.fitBounds(bounds, { padding: [60, 60] })
        }
      }
    })
  }, [restaurants, checkins, highlightIds])

  const myCheckin = checkins.find((c) => c.username === username)

  return (
    <div className="relative h-full">
      <style>{`@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}`}</style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />

      {selectedRestaurant && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-xl p-4 z-[1000]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg">{selectedRestaurant.name}</h3>
              <span className="text-sm text-gray-500">{selectedRestaurant.category} · {selectedRestaurant.price}</span>
            </div>
            <button onClick={() => setSelectedRestaurant(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {selectedRestaurant.menus.map((m) => (
              <span key={m} className="bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
          <div className="text-xs text-gray-500 mb-3 space-y-0.5">
            {selectedRestaurant.hours && <p>🕐 {selectedRestaurant.hours}</p>}
            {selectedRestaurant.phone && <p>📞 {selectedRestaurant.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-1 mb-3 text-xs text-gray-500">
            {checkins.filter((c) => c.restaurantId === selectedRestaurant.id).map((c) => (
              <span key={c.id} className="bg-gray-100 px-2 py-0.5 rounded-full">{c.username}</span>
            ))}
          </div>
          {myCheckin?.restaurantId === selectedRestaurant.id ? (
            <button
              onClick={() => { onCheckout(myCheckin.id); setSelectedRestaurant(null) }}
              className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 font-semibold"
            >
              체크아웃
            </button>
          ) : (
            <button
              onClick={() => { onCheckin(selectedRestaurant.id); setSelectedRestaurant(null) }}
              className="w-full py-2 rounded-xl bg-orange-500 text-white font-semibold"
            >
              나도 갈래! 🙋
            </button>
          )}
        </div>
      )}
    </div>
  )
}
