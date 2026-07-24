// Generates the "new order" alert tone with the Web Audio API instead of
// playing an audio file — nothing to host, nothing that can 404.
let sharedCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!sharedCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    sharedCtx = new Ctor()
  }
  // Browsers suspend audio contexts created/left idle without a user
  // gesture — resuming here is a no-op once it's already unlocked.
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {})
  return sharedCtx
}

// Call this from a real click/keydown early on (e.g. on mount of a page the
// admin is actively using) so the browser's autoplay policy has already
// granted audio permission by the time a real alert needs to play.
export function unlockAudio() {
  getAudioContext()
}

export function playNewOrderBeep() {
  const ctx = getAudioContext()
  if (!ctx) return
  const now = ctx.currentTime
  const tone = (start: number, freq: number, duration: number) => {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
  }
  tone(now, 988, 0.18)
  tone(now + 0.22, 988, 0.18)
}
