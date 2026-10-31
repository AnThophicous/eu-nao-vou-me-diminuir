/** Original procedural score. Every voice, including impacts, shares one master. */
export class Atmosphere {
  readonly context: AudioContext;
  private readonly bus: GainNode;
  private readonly master: GainNode;
  private readonly nodes = new Set<AudioNode>();
  private readonly sources = new Set<AudioScheduledSourceNode>();
  private readonly noise: AudioBuffer;
  private volume: number;
  private visible = !document.hidden;
  private started = false;
  private closing: Promise<void> | null = null;
  private pulseTimer: ReturnType<typeof setInterval> | null = null;

  constructor(volume: number) {
    this.context = new AudioContext();
    this.volume = volume;
    const ctx = this.context;
    this.bus = this.keep(ctx.createGain());
    const highpass = this.keep(ctx.createBiquadFilter());
    highpass.type = "highpass";
    highpass.frequency.value = 65;
    const lowpass = this.keep(ctx.createBiquadFilter());
    lowpass.type = "lowpass";
    lowpass.frequency.value = 2400;
    lowpass.Q.value = 0.45;
    const compressor = this.keep(ctx.createDynamicsCompressor());
    compressor.threshold.value = -19;
    compressor.knee.value = 14;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.24;
    this.master = this.keep(ctx.createGain());
    this.master.gain.value = 0;
    this.bus.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(compressor);
    compressor.connect(this.master);
    this.master.connect(ctx.destination);

    // A local, deterministic noise buffer. No recording or remote media.
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const samples = this.noise.getChannelData(0);
    let seed = 0x4e4f5249;
    for (let i = 0; i < samples.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      samples[i] = (seed >>> 0) / 2147483648 - 1;
    }
  }

  private keep<T extends AudioNode>(node: T): T {
    this.nodes.add(node);
    return node;
  }

  async start() {
    await this.context.resume();
    if (this.closing || this.context.state !== "running" || this.started)
      return;
    this.started = true;
    const ctx = this.context;
    // The upper voices make the pressure audible on laptop speakers as well.
    const voices: [number, OscillatorType, number, number][] = [
      [110, "triangle", 0.16, -3],
      [164.81, "sawtooth", 0.034, 3],
      [220.5, "sine", 0.09, 0],
      [329.63, "triangle", 0.055, -4],
    ];
    for (const [frequency, type, amplitude, detune] of voices) {
      const source = this.keep(ctx.createOscillator());
      const envelope = this.keep(ctx.createGain());
      source.type = type;
      source.frequency.value = frequency;
      source.detune.value = detune;
      envelope.gain.value = amplitude;
      source.connect(envelope);
      envelope.connect(this.bus);
      this.sources.add(source);
      source.start();
    }
    const noise = this.keep(ctx.createBufferSource());
    const noiseFilter = this.keep(ctx.createBiquadFilter());
    const noiseGain = this.keep(ctx.createGain());
    noise.buffer = this.noise;
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 780;
    noiseFilter.Q.value = 0.65;
    noiseGain.gain.value = 0.055;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.bus);
    this.sources.add(noise);
    noise.start();

    // Slow breath in the texture; this is not a melody or a song sample.
    const breath = this.keep(ctx.createOscillator());
    const breathDepth = this.keep(ctx.createGain());
    breath.frequency.value = 0.22;
    breathDepth.gain.value = 0.024;
    breath.connect(breathDepth);
    breathDepth.connect(noiseGain.gain);
    this.sources.add(breath);
    breath.start();
    this.setVolume(this.volume);
    this.pulseTimer = setInterval(() => {
      if (this.visible && ctx.state === "running") this.impact(0.25, false);
    }, 2200);
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume));
    if (this.closing || this.context.state === "closed") return;
    const gain =
      this.visible && this.started
        ? Math.pow(this.volume / 100, 0.85) * 0.8
        : 0;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(gain, this.context.currentTime, 0.065);
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    this.setVolume(this.volume);
  }

  strike() {
    this.impact(0.7, false);
  }

  release() {
    this.impact(1, true);
  }

  private impact(strength: number, release: boolean) {
    const ctx = this.context;
    if (
      !this.started ||
      !this.visible ||
      this.closing ||
      ctx.state !== "running"
    )
      return;
    const now = ctx.currentTime;
    const duration = release ? 1.25 : 0.23;
    const source = ctx.createOscillator();
    const envelope = ctx.createGain();
    source.type = release ? "sawtooth" : "triangle";
    source.frequency.setValueAtTime(release ? 660 : 440, now);
    source.frequency.exponentialRampToValueAtTime(
      release ? 110 : 165,
      now + duration,
    );
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.16 * strength, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(envelope);
    envelope.connect(this.bus);
    this.sources.add(source);
    source.onended = () => {
      source.disconnect();
      envelope.disconnect();
      this.sources.delete(source);
    };
    source.start(now);
    source.stop(now + duration + 0.02);

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const noiseEnvelope = ctx.createGain();
    noise.buffer = this.noise;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(release ? 1800 : 1100, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);
    filter.Q.value = 0.7;
    noiseEnvelope.gain.setValueAtTime(0, now);
    noiseEnvelope.gain.linearRampToValueAtTime(0.22 * strength, now + 0.012);
    noiseEnvelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    noise.connect(filter);
    filter.connect(noiseEnvelope);
    noiseEnvelope.connect(this.bus);
    this.sources.add(noise);
    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      noiseEnvelope.disconnect();
      this.sources.delete(noise);
    };
    noise.start(now);
    noise.stop(now + duration + 0.02);
  }

  close(): Promise<void> {
    if (this.closing) return this.closing;
    if (this.pulseTimer) clearInterval(this.pulseTimer);
    this.master.gain.value = 0;
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* A short voice may already have ended. */
      }
      source.disconnect();
    }
    this.sources.clear();
    for (const node of this.nodes) node.disconnect();
    this.nodes.clear();
    this.closing =
      this.context.state === "closed"
        ? Promise.resolve()
        : this.context.close();
    return this.closing;
  }
}
