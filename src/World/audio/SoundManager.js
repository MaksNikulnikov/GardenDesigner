// All audio asset paths
const AUDIO_PATHS = {
  MUSIC_MAIN: "assets/audio/theme.mp3",
  SFX_CLICK: "assets/audio/click.mp3",
  SFX_HARVEST: "assets/audio/harvest.mp3",
  SFX_BUILD: "assets/audio/place.mp3",
  SFX_PLACE: "assets/audio/place.mp3",
  SFX_PLACE_CHICKEN: "assets/audio/chicken.mp3",
};

// Readable sound keys for safe usage
export const SOUND_KEYS = Object.freeze({
  MUSIC_MAIN: "MUSIC_MAIN",
  CLICK: "SFX_CLICK",
  HARVEST: "SFX_HARVEST",
  BUILD: "SFX_BUILD",
  PLACE: "SFX_PLACE",
  PLACE_CHICKEN: "SFX_PLACE_CHICKEN",
});

/**
 * Singleton sound controller.
 * Manages background music and sound effects for the entire game.
 */
export class SoundManager {
  static _instance = null;

  static get instance() {
    if (!SoundManager._instance) {
      SoundManager._instance = new SoundManager();
    }
    return SoundManager._instance;
  }

  constructor({ musicVolume = 0.5, sfxVolume = 0.8 } = {}) {
    if (SoundManager._instance) return SoundManager._instance;

    this.musicVolume = musicVolume;
    this.sfxVolume = sfxVolume;
    this.music = null;
    this.sfx = new Map();
    this._unlocked = false;

    SoundManager._instance = this;
  }

  /** Returns or creates an AudioContext */
  _getCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web Audio API is not supported in this browser");
      }
      this.ctx = new AudioCtx();
    }
    return this.ctx;
  }

  /** Resumes AudioContext after user interaction */
  _unlockAudio() {
    if (this._unlocked) return;
    const ctx = this._getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        this._unlocked = true;
      });
    } else {
      this._unlocked = true;
    }
  }

  /** Fetches and decodes an audio buffer */
  async _loadBuffer(url) {
    const ctx = this._getCtx();
    try {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      return await ctx.decodeAudioData(arr);
    } catch (err) {
      console.warn(`[SoundManager] Failed to load: ${url}`, err);
      return null;
    }
  }

  /** Loads all audio assets (music and SFX) */
  async loadAll() {
    this.musicBuffer = await this._loadBuffer(AUDIO_PATHS.MUSIC_MAIN);

    for (const [name, url] of Object.entries(AUDIO_PATHS)) {
      if (name.startsWith("SFX_")) {
        const buffer = await this._loadBuffer(url);
        if (buffer) this.sfx.set(name, buffer);
      }
    }
  }

  /** Starts background music (looped by default) */
  playMusic(loop = true) {
    if (!this.musicBuffer) return;
    const ctx = this._getCtx();
    this.stopMusic();

    const src = ctx.createBufferSource();
    src.buffer = this.musicBuffer;
    src.loop = loop;

    const gain = ctx.createGain();
    gain.gain.value = this.musicVolume;
    src.connect(gain).connect(ctx.destination);
    src.start(0);

    this.music = { src, gain };
  }

  /** Stops currently playing music */
  stopMusic() {
    if (this.music) {
      try {
        this.music.src.stop();
      } catch {}
      this.music = null;
    }
  }

  /** Plays a one-shot sound effect */
  playSfx(key) {
    const buffer = this.sfx.get(key);
    if (!buffer) return;
    const ctx = this._getCtx();

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = this.sfxVolume;
    src.connect(gain).connect(ctx.destination);
    src.start(0);
  }

  /** Adjusts background music volume */
  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.music?.gain) this.music.gain.gain.value = v;
  }

  /** Adjusts SFX volume */
  setSfxVolume(v) {
    this.sfxVolume = v;
  }
}
