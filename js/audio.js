class AudioManager {
    constructor() {
        this.context = null;
        this.muted = false;
        this.sounds = {};
        this.initialized = false;
        this.bgmAudio = null;
        this.currentBgm = null;
        this.bgmVolume = 0.3;
        this.bgmPlaylist = null;
        this.bgmIndex = 0;
        this.userInteracted = false;
        this.pendingBgm = null;
    }

    requireInteraction() {
        if (!this.userInteracted) {
            this.userInteracted = true;
            if (this.pendingBgm) {
                const pending = this.pendingBgm;
                this.pendingBgm = null;
                this.playBgm(pending, true);
            }
        }
    }

    async init() {
        if (this.initialized) return;
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    async playSound(type) {
        if (this.muted || !this.initialized) return;
        await this.init();

        const soundGenerators = {
            click: () => this.playTone(800, 0.08, 'sine', 0.15),
            cardPlay: () => this.playCardSound(),
            cardSelect: () => this.playTone(600, 0.05, 'sine', 0.1),
            victory: () => this.playVictory(),
            defeat: () => this.playDefeat(),
            star: () => this.playTone(1200, 0.15, 'sine', 0.2),
            error: () => this.playTone(300, 0.2, 'square', 0.1)
        };

        if (soundGenerators[type]) {
            soundGenerators[type]();
        }
    }

    playBgm(type, force = false) {
        if (this.muted && !force) return;

        if (!this.userInteracted && !force) {
            this.pendingBgm = type;
            return;
        }

        if (this.currentBgm === type && !force) return;

        this.stopBgm();

        if (type === 'game') {
            this.bgmPlaylist = ['局内bgm1.mp3', '局内bgm2.mp3'];
            this.bgmIndex = 0;
            this.playNextBgm();
        } else {
            let src = '';
            if (type === 'login') {
                src = '登录界面bgm.mp3';
            } else if (type === 'hall') {
                src = '大厅界面bgm.mp3';
            }

            if (!src) return;

            this.bgmAudio = new Audio(src);
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = this.bgmVolume;
            this.bgmAudio.play().catch(e => {
                console.warn('BGM play failed:', e);
            });
        }
        this.currentBgm = type;
    }

    playNextBgm() {
        if (this.muted || !this.bgmPlaylist) return;

        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio = null;
        }

        const src = this.bgmPlaylist[this.bgmIndex];
        this.bgmAudio = new Audio(src);
        this.bgmAudio.volume = this.bgmVolume;

        this.bgmAudio.addEventListener('ended', () => {
            this.bgmIndex = (this.bgmIndex + 1) % this.bgmPlaylist.length;
            this.playNextBgm();
        });

        this.bgmAudio.play().catch(e => {
            console.warn('BGM play failed:', e);
        });
    }

    stopBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
        this.bgmPlaylist = null;
        this.bgmIndex = 0;
        this.currentBgm = null;
    }

    setBgmVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmAudio) {
            this.bgmAudio.volume = this.bgmVolume;
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);

        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    playCardSound() {
        if (!this.context) return;
        this.playTone(400, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(500, 0.08, 'triangle', 0.15), 50);
    }

    playVictory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.2, 'sine', 0.2), i * 100);
        });
    }

    playDefeat() {
        const notes = [400, 350, 300];
        notes.forEach((note, i) => {
            setTimeout(() => this.playTone(note, 0.3, 'sine', 0.15), i * 150);
        });
    }

    toggle() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBgm();
        } else if (this.currentBgm) {
            this.playBgm(this.currentBgm, true);
        }
        return this.muted;
    }
}

window.AudioManager = AudioManager;
