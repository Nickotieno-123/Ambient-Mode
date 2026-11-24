/**
 * Ambient Web Display - Procedural Web Audio Synthesizer
 * Generates continuous, click-free natural soundscapes using the Web Audio API
 * No external MP3 files needed - 100% offline, realistic, and infinite.
 */

class AmbientAudioEngine {
    constructor() {
        this.ctx = null;
        this.currentSound = null;
        this.masterGain = null;
        this.volume = 0.5;
        this.isMuted = false;
        this.activeNodes = [];
        this.intervalIds = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized && this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;
    }

    async ensureContext() {
        if (!this.isInitialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx && !this.isMuted) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain && this.ctx) {
            const targetGain = this.isMuted ? 0 : this.volume;
            this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
        }
        return this.isMuted;
    }

    stopCurrent() {
        this.intervalIds.forEach(id => clearInterval(id));
        this.intervalIds = [];

        this.activeNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                if (node.disconnect) node.disconnect();
            } catch (e) {
                // Ignore already stopped nodes
            }
        });
        this.activeNodes = [];
        this.currentSound = null;
    }

    // Creates 5 seconds of pink noise buffer (more natural than white noise)
    createPinkNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
        return buffer;
    }

    /**
     * 1. Gentle Rain on Window Soundscape
     */
    async playRain() {
        await this.ensureContext();
        this.stopCurrent();
        this.currentSound = 'rain';

        const pinkBuffer = this.createPinkNoiseBuffer();
        
        // Base rain stream
        const rainSource = this.ctx.createBufferSource();
        rainSource.buffer = pinkBuffer;
        rainSource.loop = true;

        // Bandpass filter for rain frequency character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1100, this.ctx.currentTime);

        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(300, this.ctx.currentTime);

        const rainGain = this.ctx.createGain();
        rainGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

        rainSource.connect(highpass);
        highpass.connect(filter);
        filter.connect(rainGain);
        rainGain.connect(this.masterGain);

        rainSource.start(0);
        this.activeNodes.push(rainSource, filter, highpass, rainGain);

        // Distant subtle thunder rumble every 20-40 seconds
        const thunderInterval = setInterval(() => {
            if (this.currentSound !== 'rain') return;
            this.playThunderRumble();
        }, 22000);
        this.intervalIds.push(thunderInterval);
    }

    playThunderRumble() {
        if (!this.ctx || this.currentSound !== 'rain') return;
        const now = this.ctx.currentTime;
        const thunderSource = this.ctx.createBufferSource();
        thunderSource.buffer = this.createPinkNoiseBuffer();
        
        const thunderFilter = this.ctx.createBiquadFilter();
        thunderFilter.type = 'lowpass';
        thunderFilter.frequency.setValueAtTime(120, now);

        const thunderGain = this.ctx.createGain();
        thunderGain.gain.setValueAtTime(0.001, now);
        thunderGain.gain.linearRampToValueAtTime(0.25, now + 1.8);
        thunderGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

        thunderSource.connect(thunderFilter);
        thunderFilter.connect(thunderGain);
        thunderGain.connect(this.masterGain);

        thunderSource.start(now);
        thunderSource.stop(now + 6.5);
    }

    /**
     * 2. Cozy Fireplace Embers & Crackle
     */
    async playFireplace() {
        await this.ensureContext();
        this.stopCurrent();
        this.currentSound = 'fireplace';

        // Warm low hum of the fire base
        const noiseBuffer = this.createPinkNoiseBuffer();
        const fireSource = this.ctx.createBufferSource();
        fireSource.buffer = noiseBuffer;
        fireSource.loop = true;

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);

        const fireGain = this.ctx.createGain();
        fireGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        fireSource.connect(lowpass);
        lowpass.connect(fireGain);
        fireGain.connect(this.masterGain);
        fireSource.start(0);

        this.activeNodes.push(fireSource, lowpass, fireGain);

        // Procedural micro-snaps and crackles
        const crackleInterval = setInterval(() => {
            if (this.currentSound !== 'fireplace' || !this.ctx) return;
            if (Math.random() < 0.65) {
                this.playFireCrackle();
            }
        }, 180);
        this.intervalIds.push(crackleInterval);
    }

    playFireCrackle() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const crackleGain = this.ctx.createGain();
        
        // Random pitch for woody pop
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250 + Math.random() * 850, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        const vol = 0.05 + Math.random() * 0.18;
        crackleGain.gain.setValueAtTime(vol, now);
        crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04 + Math.random() * 0.03);

        osc.connect(crackleGain);
        crackleGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    /**
     * 3. Ocean Waves Ebb & Flow
     */
    async playOcean() {
        await this.ensureContext();
        this.stopCurrent();
        this.currentSound = 'ocean';

        const noiseBuffer = this.createPinkNoiseBuffer();
        const oceanSource = this.ctx.createBufferSource();
        oceanSource.buffer = noiseBuffer;
        oceanSource.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);

        const waveGain = this.ctx.createGain();
        waveGain.gain.setValueAtTime(0.1, this.ctx.currentTime);

        // LFO for slow breathing swells (approx. 8-10 second wave cycle)
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.11, this.ctx.currentTime);

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        // Modulate both filter cutoff and gain
        lfo.connect(waveGain.gain);

        oceanSource.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(this.masterGain);

        lfo.start(0);
        oceanSource.start(0);

        this.activeNodes.push(oceanSource, filter, waveGain, lfo, lfoGain);
    }

    /**
     * 4. Ambient Meditative Drone / Singing Bowl (432Hz Calm)
     */
    async playAmbientDrone() {
        await this.ensureContext();
        this.stopCurrent();
        this.currentSound = 'drone';

        const fundamental = 108; // Deep resonant A
        const harmonics = [1, 1.5, 2, 2.67, 3]; // Beautiful harmonic ratios
        
        harmonics.forEach((ratio, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
            // Slight detune for rich lush acoustic chorus
            const detune = (idx - 2) * 3.5;
            osc.frequency.setValueAtTime(fundamental * ratio + detune, this.ctx.currentTime);

            // Subtle slow tremolo
            const tremolo = this.ctx.createOscillator();
            tremolo.frequency.setValueAtTime(0.1 + idx * 0.04, this.ctx.currentTime);
            const tremoloGain = this.ctx.createGain();
            tremoloGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            tremolo.connect(gain.gain);
            tremolo.start(0);

            const baseVol = 0.16 / (idx + 1);
            gain.gain.setValueAtTime(baseVol, this.ctx.currentTime);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(0);

            this.activeNodes.push(osc, gain, tremolo, tremoloGain);
        });
    }

    /**
     * 5. Forest Wind & Distant Birds
     */
    async playForest() {
        await this.ensureContext();
        this.stopCurrent();
        this.currentSound = 'forest';

        // Gentle rustling wind noise
        const windBuffer = this.createPinkNoiseBuffer();
        const windSource = this.ctx.createBufferSource();
        windSource.buffer = windBuffer;
        windSource.loop = true;

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
        windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

        const windGain = this.ctx.createGain();
        windGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

        windSource.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.masterGain);
        windSource.start(0);

        this.activeNodes.push(windSource, windFilter, windGain);

        // Random subtle bird songs
        const birdInterval = setInterval(() => {
            if (this.currentSound !== 'forest' || !this.ctx) return;
            if (Math.random() < 0.4) {
                this.playBirdChirp();
            }
        }, 3500);
        this.intervalIds.push(birdInterval);
    }

    playBirdChirp() {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFreq = 2200 + Math.random() * 800;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq + 700, now + 0.08);
        osc.frequency.linearRampToValueAtTime(baseFreq - 300, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    switchSound(type) {
        if (!type || type === 'none') {
            this.stopCurrent();
            return;
        }
        switch (type) {
            case 'rain': this.playRain(); break;
            case 'fireplace': this.playFireplace(); break;
            case 'ocean': this.playOcean(); break;
            case 'drone': this.playAmbientDrone(); break;
            case 'forest': this.playForest(); break;
            default: this.stopCurrent(); break;
        }
    }
}

// Global audio singleton
window.ambientAudio = new AmbientAudioEngine();
