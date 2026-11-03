/**
 * Phone-style ring made with the Web Audio API, so there are no sound files to ship:
 * a 440 + 480 Hz tone (the North American ring) for 1.2 s, every 3 s. Used both as the
 * ringtone for incoming calls and, quieter, as the ringback a caller hears.
 */
export class Ringer {
  #context?: AudioContext;
  #timer?: ReturnType<typeof setInterval>;

  start(volume = 0.08): void {
    if (this.#timer) return;
    this.#ring(volume);
    this.#timer = setInterval(() => this.#ring(volume), 3000);
  }

  stop(): void {
    clearInterval(this.#timer);
    this.#timer = undefined;
    void this.#context?.close().catch(() => undefined);
    this.#context = undefined;
  }

  #ring(volume: number): void {
    try {
      this.#context ??= new AudioContext();
      const context = this.#context;
      const gain = context.createGain();
      gain.gain.value = volume;
      gain.connect(context.destination);
      for (const frequency of [440, 480]) {
        const tone = context.createOscillator();
        tone.frequency.value = frequency;
        tone.connect(gain);
        tone.start();
        tone.stop(context.currentTime + 1.2);
      }
    } catch {
      // Audio unavailable or blocked: the call screen still shows what's happening.
    }
  }
}
