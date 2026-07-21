import { AMBIENT_SOUNDS } from "../constants/StudySessionConstants";

class AmbientAudioManager {
  constructor() {
    if (typeof window === "undefined") return;

    // Single global Audio instance
    this.audio = new Audio();
    this.currentSound = null; // Selected sound configuration object
    this.previousAmbience = null; // Retained ambience configuration for motivation callbacks
    this.volume = 0.35;
    this.isMuted = false;
    this.fadeInterval = null;
    this.userInteracted = false;
    this.listeners = new Set();
    this.failedSoundIds = new Set();
    this.autoplayWarningLogged = false;

    // Recover settings from localStorage
    const savedVol = localStorage.getItem("cleverprep_focus_volume");
    this.volume = savedVol ? parseFloat(savedVol) : 0.35;
    this.isMuted = localStorage.getItem("cleverprep_focus_muted") === "true";

    // Setup initial HTML5 audio properties
    this.audio.volume = this.isMuted ? 0 : this.volume;
    this.audio.muted = this.isMuted;

    // Listeners for ended state and errors
    this.audio.addEventListener("ended", () => {
      this.handleEnded();
    });

    this.audio.oncanplay = () => {
      // Audio ready to play
    };

    this.audio.onerror = (e) => {
      if (this.currentSound) {
        console.warn(`[AmbientAudioManager] Audio resource load error for track "${this.currentSound.title}" (${this.audio.src}). Marking as unavailable.`);
        this.failedSoundIds.add(this.currentSound.id);
        this.stop();
      }
    };

    // Run dynamic pre-flight verification on startup
    this.verifyTracks();
  }

  // Pre-flight validation checks to verify playability and asset presence
  async verifyTracks() {
    const checkPromises = AMBIENT_SOUNDS.map(async (sound) => {
      // 1. Verify type support
      const ext = sound.filePath.split(".").pop();
      const mime = ext === "mp3" ? "audio/mpeg" : `audio/${ext}`;
      const canPlay = this.audio.canPlayType(mime);
      if (canPlay === "" || canPlay === "no") {
        console.warn(`[AmbientAudioManager] Mime type "${mime}" unsupported by browser for track "${sound.title}"`);
        this.failedSoundIds.add(sound.id);
        return;
      }

      // 2. Verify asset presence via HEAD fetch
      try {
        const res = await fetch(sound.filePath, { method: "HEAD" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        console.warn(`[AmbientAudioManager] Mismatch or missing file verified for track "${sound.title}" (${sound.filePath}):`, err.message);
        this.failedSoundIds.add(sound.id);
      }
    });

    await Promise.all(checkPromises);

    // Print single clean validation report on startup
    console.log("=== CleverPrep Study Environment Validation Report ===");
    AMBIENT_SOUNDS.forEach((sound) => {
      const isFailed = this.failedSoundIds.has(sound.id);
      const symbol = isFailed ? "✗" : "✓";
      console.log(`${symbol} ${sound.title} (${sound.id})`);
    });
    console.log("======================================================");

    this.notify();
  }

  // Subscribe to changes in sound selection (useful to sync React state)
  subscribe(callback) {
    this.listeners.add(callback);
    // Initial emission
    callback({
      currentSoundId: this.currentSound ? this.currentSound.id : null,
      isMuted: this.isMuted,
      volume: this.volume,
      failedSoundIds: Array.from(this.failedSoundIds)
    });
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      currentSoundId: this.currentSound ? this.currentSound.id : null,
      isMuted: this.isMuted,
      volume: this.volume,
      failedSoundIds: Array.from(this.failedSoundIds)
    };
    this.listeners.forEach((callback) => callback(state));
  }

  setUserInteracted() {
    this.userInteracted = true;
  }

  setVolume(vol) {
    this.volume = vol;
    localStorage.setItem("cleverprep_focus_volume", vol.toString());
    if (!this.fadeInterval) {
      this.audio.volume = this.isMuted ? 0 : vol;
    }
    this.notify();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem("cleverprep_focus_muted", this.isMuted.toString());
    this.audio.muted = this.isMuted;
    if (!this.fadeInterval) {
      this.audio.volume = this.isMuted ? 0 : this.volume;
    }
    if (!this.isMuted && this.currentSound) {
      this.userInteracted = true;
    }
    this.notify();
  }

  // Primary Crossfade & Playback routing
  play(soundId) {
    if (!soundId) {
      this.stop();
      return;
    }

    // Guard: Prevent re-starting if the same track is already loaded and active
    if (this.currentSound && this.currentSound.id === soundId && this.audio.src && !this.audio.paused) {
      return;
    }

    const sound = AMBIENT_SOUNDS.find((s) => s.id === soundId);
    if (!sound || this.failedSoundIds.has(soundId)) {
      console.warn(`[AmbientAudioManager] Track ${soundId} is not available or disabled.`);
      this.stop();
      return;
    }

    // Set user interaction flag to allow HTML5 play triggers
    this.userInteracted = true;

    // Track Motivation workflow logic
    if (sound.category === "Motivation") {
      if (this.currentSound && this.currentSound.category === "Focus Ambience") {
        this.previousAmbience = this.currentSound;
      }
    } else {
      this.previousAmbience = null;
    }

    const targetVolume = this.isMuted ? 0 : this.volume;
    const playNewTrack = () => {
      this.currentSound = sound;
      this.audio.src = sound.filePath;
      this.audio.loop = sound.loop;
      this.audio.volume = 0;
      
      this.audio.play()
        .then(() => {
          this.startFade(targetVolume, 600);
        })
        .catch((err) => {
          if (!this.autoplayWarningLogged) {
            console.warn("[AmbientAudioManager] Audio playback blocked by browser autoplay rules:", err.message);
            this.autoplayWarningLogged = true;
          }
        });
      this.notify();
    };

    // Cross-fade if already playing
    if (this.audio.src && !this.audio.paused) {
      this.startFade(0, 600, () => {
        this.audio.pause();
        playNewTrack();
      });
    } else {
      playNewTrack();
    }
  }

  stop() {
    this.previousAmbience = null;
    if (this.audio.src && !this.audio.paused) {
      this.startFade(0, 600, () => {
        this.audio.pause();
        this.currentSound = null;
        this.notify();
      });
    } else {
      this.currentSound = null;
      this.notify();
    }
  }

  // Handle Motivation finished (play once ➔ restore fallback ambience if set)
  handleEnded() {
    if (this.currentSound && !this.currentSound.loop) {
      const prev = this.previousAmbience;
      this.previousAmbience = null; // Clear queue buffer

      if (prev && !this.failedSoundIds.has(prev.id)) {
        console.log(`[AmbientAudioManager] Motivation finished. Restoring: ${prev.title}`);
        this.play(prev.id);
      } else {
        this.currentSound = null;
        this.notify();
      }
    }
  }

  startFade(targetVolume, durationMs, onComplete) {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.audio.volume;
    const volumeDelta = targetVolume - startVolume;
    const stepTime = 50; // Ticks every 50ms
    const numSteps = Math.max(1, durationMs / stepTime);
    const volumeStep = volumeDelta / numSteps;
    let stepCount = 0;

    this.fadeInterval = setInterval(() => {
      stepCount++;
      let newVol = startVolume + volumeStep * stepCount;
      newVol = Math.max(0, Math.min(1, newVol));
      
      this.audio.volume = this.isMuted ? 0 : newVol;

      if (stepCount >= numSteps) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
        this.audio.volume = this.isMuted ? 0 : targetVolume;
        if (onComplete) onComplete();
      }
    }, stepTime);
  }

  cleanup() {
    if (this.fadeInterval) clearInterval(this.fadeInterval);
    this.audio.pause();
    this.currentSound = null;
    this.previousAmbience = null;
  }
}

// Export single shared instance for entire application context
export const audioManager = new AmbientAudioManager();
export default audioManager;
