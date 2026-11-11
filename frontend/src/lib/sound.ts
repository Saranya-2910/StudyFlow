/**
 * Web Audio API synthesized sound generator for timer milestones and celebrations.
 * Avoids broken external audio URLs and works offline seamlessly.
 */

export function playTimerCompletionSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Pleasant three-note ascending chime (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.18);

      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + index * 0.18 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.18 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + index * 0.18);
      osc.stop(ctx.currentTime + index * 0.18 + 0.85);
    });
  } catch {
    // AudioContext blocked or unsupported
  }
}

export function playPauseResumeSound(isPause: boolean) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isPause ? 440 : 587.33, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // AudioContext blocked
  }
}

export type AmbientSoundType = "none" | "brown_noise" | "rain" | "binaural_beat";

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private currentType: AmbientSoundType = "none";
  private currentVolume: number = 0.5;

  private initContext() {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.ctx && this.masterGain) {
      try {
        this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
        }
        node.disconnect();
      } catch {
        // ignore disconnect errors
      }
    });
    this.activeNodes = [];
    this.currentType = "none";
  }

  public play(type: AmbientSoundType) {
    if (type === "none") {
      this.stop();
      return;
    }
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    this.stop();
    this.currentType = type;

    try {
      if (type === "brown_noise") {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 3.5;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(400, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(this.masterGain);
        noiseSource.start();

        this.activeNodes.push(noiseSource, filter);
      } else if (type === "rain") {
        const bufferSize = ctx.sampleRate * 4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;
        noiseSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1200, ctx.currentTime);

        noiseSource.connect(filter);
        filter.connect(this.masterGain);
        noiseSource.start();

        this.activeNodes.push(noiseSource, filter);
      } else if (type === "binaural_beat") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(200, ctx.currentTime);
        gain1.gain.setValueAtTime(0.35, ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(240, ctx.currentTime);
        gain2.gain.setValueAtTime(0.35, ctx.currentTime);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(this.masterGain);
        gain2.connect(this.masterGain);

        osc1.start();
        osc2.start();

        this.activeNodes.push(osc1, osc2, gain1, gain2);
      }
    } catch {
      // Audio processing error fallback
    }
  }

  public getType(): AmbientSoundType {
    return this.currentType;
  }
}

export const ambientSound = new AmbientSoundEngine();

