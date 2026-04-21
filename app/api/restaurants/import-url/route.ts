import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function mapCategory(cat: string): string {
  const c = cat
  if (/일식|초밥|스시|라멘|돈카츠|우동|소바|덮밥|이자카야|야키토리|오마카세|튀김|텐동|규동/.test(c)) return '일식'
  if (/중식|중국|훠궈|딤섬|마라|마라탕|짜장|짬뽕/.test(c)) return '중식'
  if (/이탈리아|피자|파스타|햄버거|스테이크|양식|브런치|샌드위치|멕시코|타코|패밀리레스토랑/.test(c)) return '양식'
  if (/분식|김밥|떡볶이|순대|라볶이/.test(c)) return '분식'
  if (/베트남|쌀국수|반미|퍼/.test(c)) return '베트남'
  return '한식'
}

function guessPriceLevel(cat: string): number {
  if (/스테이크|오마카세|이탈리아|고급/.test(cat)) return 3
  if (/분식|김밥|편의/.test(cat)) return 1
  return 2
}

function guessSatiety(cat: string): string {
  if (/국밥|찌개|돈까스|정식|뼈|보쌈|족발|훠궈/.test(cat)) return 'heavy'
  if (/카페|샐러드|스무디|분식/.test(cat)) return 'light'
  return 'medium'
}

function guessSpeed(cat: string): string {
  if (/패스트푸드|햄버거|분식|김밥|편의/.test(cat)) return 'fast'
  if (/오마카세|코스|스테이크/.test(cat)) return 'slow'
  return 'normal'
}

function findJsonObjectEnd(str: string, start: number): number {
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < str.length; i++) {
    const c = str[i]
    if (escape) { escape = false; continue }
    if (c === '\\' && inString) { escape = true; continue }
    if (c === '"') { inString = !inString; continue }
    if (inString) continue
    if (c === '{') depth++
    else if (c === '}') { depth--; if (depth === 0) return i + 1 }
  }
  return -1
}

function extractApolloState(html: string): Record<string, unknown> | null {
  const marker = 'window.__APOLLO_STATE__ = '
  const start = html.indexOf(marker)
  if (start === -1) return null
  const jsonStart = html.indexOf('{', start + marker.length)
  if (jsonStart === -1) return null
  const jsonEnd = findJsonObjectEnd(html, jsonStart)
  if (jsonEnd === -1) return null
  try {
    return JSON.parse(html.slice(jsonStart, jsonEnd)) as Record<string, unknown>
  } catch {
    return null
  }
}

async function resolveUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
  })
  return res.url
}

function extractPlaceId(url: string): string | null {
  // Path pattern: pcmap.place.naver.com/restaurant/12345, map.naver.com/p/entry/place/12345
  const pathMatch = url.match(/\/(?:restaurant|place)\/(\d{6,})/)
  if (pathMatch) return pathMatch[1]

  // Query param pattern: m.map.naver.com/appLink.naver?pinId=12345 or ?id=12345
  try {
    const u = new URL(url)
    const pinId = u.searchParams.get('pinId')
    if (pinId && /^\d{6,}$/.test(pinId)) return pinId
    const id = u.searchParams.get('id')
    if (id && /^\d{6,}$/.test(id)) return id
  } catch {}

  return null
}

interface PlaceDetail {
  name: string
  category: string
  lat: number
  lng: number
  phone: string | null
  hours: string | null
  menus: string[]
  address: string
}

async function fetchPlaceFromNextData(placeId: string): Promise<PlaceDetail | null> {
  const url = `https://pcmap.place.naver.com/restaurant/${placeId}/home`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'Referer': 'https://map.naver.com/',
    },
  })
  if (!res.ok) return null
  const html = await res.text()

  // Try __NEXT_DATA__
  const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1])
      const props = data?.props?.pageProps
      const place = props?.initialState?.place?.summary ?? props?.place ?? props?.summary
      if (place?.name) {
        return {
          name: place.name,
          category: place.category ?? place.categoryName ?? '',
          lat: parseFloat(place.y ?? place.lat ?? place.coordinate?.y ?? '0'),
          lng: parseFloat(place.x ?? place.lng ?? place.coordinate?.x ?? '0'),
          phone: place.phone ?? place.tel ?? null,
          hours: place.businessHours ?? place.openHour ?? null,
          menus: Array.isArray(place.menus) ? place.menus.map((m: {name?: string}) => m.name).filter(Boolean) : [],
          address: place.roadAddress ?? place.address ?? '',
        }
      }
    } catch {}
  }

  // Try __APOLLO_STATE__ direct JSON assignment: window.__APOLLO_STATE__ = {...}
  const apolloState = extractApolloState(html)
  if (apolloState) {
    const detail = apolloState[`PlaceDetailBase:${placeId}`] as Record<string, unknown> | undefined
    if (detail?.name) {
      const coord = detail.coordinate as { x?: string; y?: string } | undefined
      const menus: string[] = []
      for (let i = 0; i < 30; i++) {
        const menu = apolloState[`Menu:${placeId}_${i}`] as { name?: string } | undefined
        if (!menu) break
        if (menu.name) menus.push(menu.name)
      }
      return {
        name: detail.name as string,
        category: (detail.category as string) ?? '',
        lat: parseFloat((coord?.y) ?? '0'),
        lng: parseFloat((coord?.x) ?? '0'),
        phone: (detail.phone as string) ?? null,
        hours: (detail.openingHours as string) ?? (detail.businessHours as string) ?? null,
        menus,
        address: (detail.roadAddress as string) ?? '',
      }
    }
  }

  // Try JSON.parse wrapped variants
  const apolloWrapped = [
    html.match(/window\.__APOLLO_STATE__\s*=\s*JSON\.parse\(decodeURIComponent\("([^"]+)"\)\)/),
    html.match(/window\.__APOLLO_STATE__\s*=\s*JSON\.parse\("((?:[^"\\]|\\.)*)"\)/),
  ]
  for (const m of apolloWrapped) {
    if (!m) continue
    try {
      const state = JSON.parse(decodeURIComponent(m[1])) as Record<string, unknown>
      const detail = state[`PlaceDetailBase:${placeId}`] as Record<string, unknown> | undefined
      if (!detail?.name) continue
      const coord = detail.coordinate as { x?: string; y?: string } | undefined
      const menus: string[] = []
      for (let i = 0; i < 30; i++) {
        const menu = state[`Menu:${placeId}_${i}`] as { name?: string } | undefined
        if (!menu) break
        if (menu.name) menus.push(menu.name)
      }
      return {
        name: detail.name as string,
        category: (detail.category as string) ?? '',
        lat: parseFloat((coord?.y) ?? '0'),
        lng: parseFloat((coord?.x) ?? '0'),
        phone: (detail.phone as string) ?? null,
        hours: (detail.openingHours as string) ?? (detail.businessHours as string) ?? null,
        menus,
        address: (detail.roadAddress as string) ?? '',
      }
    } catch {}
  }

  // Try JSON-LD structured data
  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  if (ldMatch) {
    try {
      const ld = JSON.parse(ldMatch[1])
      if (ld.name && ld.geo) {
        return {
          name: ld.name,
          category: ld.servesCuisine ?? ld['@type'] ?? '',
          lat: parseFloat(ld.geo.latitude ?? '0'),
          lng: parseFloat(ld.geo.longitude ?? '0'),
          phone: ld.telephone ?? null,
          hours: ld.openingHours ?? null,
          menus: [],
          address: ld.address?.streetAddress ?? '',
        }
      }
    } catch {}
  }

  return null
}

async function fetchPlaceFromGraphQL(placeId: string): Promise<PlaceDetail | null> {
  try {
    const body = JSON.stringify([{
      operationName: 'getPlaceHome',
      query: `query getPlaceHome($input: PlaceDetailInput) { restaurant(input: $input) { id name category coordinate { x y } phone roadAddress businessHours menus { name price } } }`,
      variables: { input: { id: placeId } },
    }])
    const res = await fetch('https://pcmap-api.place.naver.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://pcmap.place.naver.com',
        'Referer': `https://pcmap.place.naver.com/restaurant/${placeId}/home`,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      body,
    })
    if (!res.ok) return null
    const data = await res.json() as Array<{ data?: { restaurant?: Record<string, unknown> } }>
    const r = data[0]?.data?.restaurant
    if (!r?.name) return null
    const coord = r.coordinate as { x?: string; y?: string } | undefined
    const menus = (r.menus as Array<{ name?: string }> ?? []).map((m) => m.name).filter(Boolean) as string[]
    return {
      name: r.name as string,
      category: r.category as string ?? '',
      lat: parseFloat(coord?.y ?? '0'),
      lng: parseFloat(coord?.x ?? '0'),
      phone: (r.phone as string) ?? null,
      hours: (r.businessHours as string) ?? null,
      menus,
      address: (r.roadAddress as string) ?? '',
    }
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json() as { url?: string }
    if (!url) return NextResponse.json({ error: 'URL이 필요합니다' }, { status: 400 })

    // Resolve short URLs (naver.me/xxx, map.naver.com/...)
    const finalUrl = await resolveUrl(url)
    const placeId = extractPlaceId(finalUrl)
    if (!placeId) {
      return NextResponse.json({ error: '유효한 네이버 식당 URL이 아닙니다' }, { status: 400 })
    }

    // Duplicate check
    const existing = await prisma.restaurant.findFirst({ where: { naverPlaceId: placeId } })
    if (existing) {
      return NextResponse.json({ error: `이미 등록된 식당입니다: ${existing.name}` }, { status: 409 })
    }

    // Try to fetch place details
    let place = await fetchPlaceFromNextData(placeId)
    if (!place || !place.lat) {
      place = await fetchPlaceFromGraphQL(placeId)
    }
    if (!place || !place.name || !place.lat) {
      return NextResponse.json({ error: '식당 정보를 가져올 수 없습니다. 네이버 식당 URL인지 확인해주세요.' }, { status: 422 })
    }

    const naverCat = place.category
    const appCat = mapCategory(naverCat)

    const canonicalNaverUrl = `https://pcmap.place.naver.com/restaurant/${placeId}/home`

    const restaurant = await prisma.restaurant.create({
      data: {
        name: place.name,
        category: appCat,
        menus: place.menus,
        price: '',
        priceLevel: guessPriceLevel(naverCat),
        rating: 0,
        lat: place.lat,
        lng: place.lng,
        hours: place.hours,
        phone: place.phone,
        satiety: guessSatiety(naverCat),
        speed: guessSpeed(naverCat),
        occasion: 'meal',
        naverUrl: canonicalNaverUrl,
        naverPlaceId: placeId,
      },
    })

    return NextResponse.json(restaurant, { status: 201 })
  } catch (e) {
    console.error('[import-url]', e)
    return NextResponse.json({ error: '가져오기 실패' }, { status: 500 })
  }
}
