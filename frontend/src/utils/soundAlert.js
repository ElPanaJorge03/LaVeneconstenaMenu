/**
 * Motor de alerta sonora con Web Audio API para el panel de mesera.
 * Respeta la política de autoplay de los navegadores: se desbloquea tras clic explícito.
 */
let audioCtx = null;

function ensureContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playOrderChime() {
  const ctx = ensureContext();
  if (!ctx) return false;

  try {
    const now = ctx.currentTime;
    const notes = [880, 1174.66, 1318.51]; // A5 -> D6 -> E6 timbre alegre de cocina
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.28, now + idx * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.36);
    });
    return true;
  } catch {
    return false;
  }
}
