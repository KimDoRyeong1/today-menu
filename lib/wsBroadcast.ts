import type { WebSocket } from 'ws'

declare global {
  // eslint-disable-next-line no-var
  var _wsClients: Set<WebSocket> | undefined
}

if (!globalThis._wsClients) {
  globalThis._wsClients = new Set()
}

export function addWsClient(ws: WebSocket) {
  globalThis._wsClients!.add(ws)
}

export function removeWsClient(ws: WebSocket) {
  globalThis._wsClients!.delete(ws)
}

export function broadcast(data: unknown) {
  const msg = JSON.stringify(data)
  globalThis._wsClients?.forEach((client) => {
    if (client.readyState === 1) client.send(msg)
  })
}
