import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { WebSocketServer } from 'ws'
import { addWsClient, removeWsClient, broadcast } from './lib/wsBroadcast'
import { prisma } from './lib/prisma'

const dev = process.env.NODE_ENV !== 'production'
const port = parseInt(process.env.PORT ?? '3000', 10)

const app = next({ dev, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true)
    await handle(req, res, parsedUrl)
  })

  // noServer: true — upgrade 이벤트를 직접 라우팅해서 Next.js HMR과 충돌 방지
  const wss = new WebSocketServer({ noServer: true })

  wss.on('connection', (ws) => {
    addWsClient(ws)
    ws.on('close', () => removeWsClient(ws))
    ws.on('error', () => removeWsClient(ws))
  })

  // Next.js 내부 HMR upgrade 핸들러
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextUpgrade = (app as any).getUpgradeHandler?.()

  httpServer.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url ?? '/')
    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
    } else if (nextUpgrade) {
      nextUpgrade(req, socket, head)
    }
  })

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://localhost:${port}`)
    scheduleMidnightReset()
  })
})

function scheduleMidnightReset() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 5, 0) // 자정 5초 후 (오차 방지)
  const delay = midnight.getTime() - now.getTime()

  setTimeout(async () => {
    const today = new Date().toISOString().slice(0, 10)
    // 오늘 이전 체크인 삭제
    await prisma.checkin.deleteMany({ where: { date: { lt: today } } }).catch(console.error)
    broadcast({ type: 'checkins_changed' })
    console.log(`[midnight] 체크인 리셋 완료 (${today})`)
    scheduleMidnightReset() // 다음 날 자정 재예약
  }, delay)

  const h = Math.floor(delay / 3600000)
  const m = Math.floor((delay % 3600000) / 60000)
  console.log(`[midnight] 리셋 예약 — ${h}시간 ${m}분 후`)
}
