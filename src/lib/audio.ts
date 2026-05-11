class AudioGen {
  ctx: AudioContext | null = null;
  isEnabled: boolean = true;
  
  init() {
    if (!this.ctx && this.isEnabled) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
    }
  }

  playType() {
    this.playTone(Math.random() * 200 + 400, 'square', 0.02, 0.03);
  }

  playClick() {
    this.playTone(600, 'sine', 0.05, 0.05);
  }
  
  playUpgrade() {
    this.playTone(523.25, 'sine', 0.1, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.1), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.1), 200); // G5
  }

  playBugSquash() {
    this.playTone(150, 'sawtooth', 0.1, 0.2);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.2, 0.2), 50);
  }

  playError() {
    this.playTone(200, 'sawtooth', 0.3, 0.2);
  }

  playGoldenIdeaSpawn() {
    this.playTone(880, 'sine', 0.1, 0.05);
    setTimeout(() => this.playTone(1760, 'sine', 0.3, 0.1), 100);
  }

  playGoldenIdeaClick() {
    this.playTone(1046.50, 'sine', 0.1, 0.1); // C6
    setTimeout(() => this.playTone(1318.51, 'sine', 0.1, 0.1), 100); // E6
    setTimeout(() => this.playTone(1567.98, 'sine', 0.3, 0.2), 200); // G6
  }

  playFrenzyMode() {
    this.playTone(400, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(500, 'square', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(600, 'square', 0.1, 0.1), 200);
    setTimeout(() => this.playTone(700, 'square', 0.4, 0.2), 300);
  }

  playHover() {
    this.playTone(300, 'sine', 0.03, 0.01);
  }
  
  playStartGame() {
    this.playTone(440, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(554.37, 'square', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659.25, 'square', 0.3, 0.15), 200);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.ctx || !this.isEnabled) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.error(e);
    }
  }
}

export const sfx = new AudioGen();
