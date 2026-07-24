// Builds a Server-Sent Events response. `subscribe` wires up whatever event
// listeners this stream cares about and must return an unsubscribe function,
// which is called automatically once the client disconnects.
export function createEventStream(subscribe: (send: (data: unknown) => void) => () => void): Response {
  const encoder = new TextEncoder()
  let ping: ReturnType<typeof setInterval> | null = null
  let unsubscribe: () => void = () => {}

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // controller already closed (client disconnected mid-emit) — ignore
        }
      }
      unsubscribe = subscribe(send)

      // Keep-alive comment ping so idle connections aren't dropped by proxies.
      ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(': ping\n\n')) } catch { /* closed */ }
      }, 20_000)
    },
    cancel() {
      if (ping) clearInterval(ping)
      unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
