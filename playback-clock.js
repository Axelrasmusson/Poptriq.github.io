// YouTube exposes media time and state, not frame presentation timestamps.
// Count observed playback conservatively; never treat a seek or stalled clock as viewing time.
export class PlaybackClock {
  constructor(target = 40) { this.target = target; this.reset(); }
  reset() { this.elapsed = 0; this.playing = false; this.media = null; this.wall = null; }
  start(media, wall) { this.playing = true; this.media = media; this.wall = wall; }
  stop() { this.playing = false; this.media = null; this.wall = null; }
  sample(media, wall, rate = 1) {
    if (this.playing && Number.isFinite(media) && Number.isFinite(this.media)) {
      const seconds = (media - this.media) / (rate > 0 ? rate : 1);
      const wallSeconds = Math.max(0, (wall - this.wall) / 1000);
      // Forward seeks must not finish a round. Backward seeks add nothing.
      if (seconds > 0 && seconds <= wallSeconds + 0.5) this.elapsed += Math.min(seconds, wallSeconds);
    }
    this.media = media;
    this.wall = wall;
    return this.elapsed >= this.target;
  }
}
