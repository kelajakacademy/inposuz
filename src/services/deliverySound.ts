// Sound synthesizer for incoming delivery orders using Web Audio API
// Generates pleasant, attention-grabbing restaurant bell / order chimes without needing external audio files

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a double doorbell / pleasant notification chime for new delivery order
 */
export function playDeliveryOrderChime(aggregator?: 'yandex_eats' | 'uzum_tezkor' | 'telegram' | 'direct') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Distinct harmonic chime sequence
    // Yandex Eats (energetic bright yellow chime: C5 -> E5 -> G5 -> C6)
    // Uzum Tezkor (rich modern chime: D5 -> F#5 -> A5 -> D6)
    // Telegram Bot (bright crisp message sound: E5 -> B5 -> E6)
    let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    if (aggregator === 'uzum_tezkor') {
      notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    } else if (aggregator === 'telegram') {
      notes = [659.25, 987.77, 1318.51]; // E5, B5, E6 (Telegram high crisp chime)
    }

    notes.forEach((freq, index) => {
      const startTime = now + index * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Volume envelope (smooth fade-in and chime decay)
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });

    // Device vibration if supported on Android / Mobile
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 300, 100, 400]);
      } catch (e) {}
    }
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

/**
 * Play an acceptance confirmation tone
 */
export function playOrderAcceptedSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const start = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) {}
}
