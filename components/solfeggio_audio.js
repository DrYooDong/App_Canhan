// ============================================
// NỘI TÂM — Solfeggio Audio Synthesizer (Web Audio API)
// ============================================

(function() {
  'use strict';

  class SolfeggioPlayer {
    constructor() {
      this.audioCtx = null;
      this.oscillator = null;
      this.gainNode = null;
      this.isPlaying = false;
      this.currentFreq = 432; // Default to 432Hz (Cosmic Tuning)
      
      // Auto change frequency based on hour of the day
      this.frequencies = {
        morning: 528, // Miracle & Transformation (6am - 12pm)
        afternoon: 432, // Harmony & Balance (12pm - 6pm)
        evening: 639, // Connecting & Relationships (6pm - 10pm)
        night: 396  // Liberating Guilt & Fear (10pm - 6am)
      };

      this.initUI();
    }

    initUI() {
      const btn = document.getElementById('audio-toggle-btn');
      if (btn) {
        btn.addEventListener('click', () => this.togglePlay());
      }
      
      // Listen for hashchange to pause if needed, but ambient music can play across tabs.
      // We will pause if page is hidden.
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && this.isPlaying) {
          this.stopAudio();
          this.isPlaying = false;
          this.updateUI();
        }
      });
    }

    determineFrequency() {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 12) return this.frequencies.morning;
      if (hour >= 12 && hour < 18) return this.frequencies.afternoon;
      if (hour >= 18 && hour < 22) return this.frequencies.evening;
      return this.frequencies.night;
    }

    initAudioContext() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
      }
    }

    playAudio() {
      this.initAudioContext();
      
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.currentFreq = this.determineFrequency();

      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sine'; // Pure sine wave for healing frequencies
      this.oscillator.frequency.value = this.currentFreq;

      // Soft attack and release
      this.gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 3); // Max volume 15% (ambient)

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start();
      
      // Subtle modulation (binaural beat effect)
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.5; // 0.5Hz sweep
      lfoGain.gain.value = 5; // 5Hz pitch variation
      lfo.connect(lfoGain);
      lfoGain.connect(this.oscillator.frequency);
      lfo.start();
      this.lfo = lfo;

      if (window.App && window.App.showToast) {
        window.App.showToast(`Đang phát tần số chữa lành ${this.currentFreq}Hz`, 'success');
      }
    }

    stopAudio() {
      if (this.gainNode) {
        // Fade out
        this.gainNode.gain.cancelScheduledValues(this.audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.audioCtx.currentTime);
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 2);
        
        setTimeout(() => {
          if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
          }
          if (this.lfo) {
            this.lfo.stop();
            this.lfo.disconnect();
            this.lfo = null;
          }
          this.gainNode.disconnect();
          this.gainNode = null;
        }, 2000);
      }
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.playAudio();
      } else {
        this.stopAudio();
      }
      this.updateUI();
    }

    updateUI() {
      const btn = document.getElementById('audio-toggle-btn');
      if (btn) {
        if (this.isPlaying) {
          btn.innerHTML = '🔊';
          btn.style.textShadow = '0 0 10px var(--accent-primary)';
          btn.classList.add('pulse');
        } else {
          btn.innerHTML = '🎵';
          btn.style.textShadow = 'none';
          btn.classList.remove('pulse');
        }
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.SolfeggioAudio = new SolfeggioPlayer();
  });

})();
