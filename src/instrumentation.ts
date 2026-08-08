// Next runs this once per server process at boot. The prep timer needs a
// long-lived process to tick in, so it's skipped on any non-Node runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPrepTimerScanner } = await import('@/lib/prep-timer-scanner')
    startPrepTimerScanner()
  }
}
