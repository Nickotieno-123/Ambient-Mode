/**
 * Ambient Web Display - Dynamic Visual Scenes Engine
 * High-performance 60FPS procedural canvas animations
 */

class AmbientVisualEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.activeScene = 'aurora';
        this.animationFrameId = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = window.devicePixelRatio || 1;
        this.time = 0;
        this.palette = 'nordic'; // nordic, terracotta, sage, midnight, sunset, neon

        // Scene state containers
        this.particles = [];
        this.raindrops = [];
        this.embers = [];
        this.geoShapes = [];

        this.initResizeListener();
        this.resize();
        this.initScene(this.activeScene);
    }

    initResizeListener() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for smooth 4K/retina performance
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        // Re-initialize particles on major dimension change
        if (this.activeScene === 'constellations') this.initConstellations();
        if (this.activeScene === 'rain') this.initRain();
        if (this.activeScene === 'fireplace') this.initEmbers();
        if (this.activeScene === 'geometric') this.initGeometric();
    }

    setPalette(paletteName) {
        this.palette = paletteName;
    }

    getPaletteColors() {
        const palettes = {
            nordic: ['#1e293b', '#334155', '#475569', '#64748b', '#0f172a'],
            terracotta: ['#451a03', '#78350f', '#9a3412', '#c2410c', '#ea580c'],
            sage: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981'],
            midnight: ['#050814', '#0f172a', '#1e1b4b', '#2e1065', '#3b0764'],
            sunset: ['#4c0519', '#831843', '#9d174d', '#be123c', '#e11d48'],
            neon: ['#09090b', '#18181b', '#27272a', '#3b82f6', '#8b5cf6'],
            warm_taupe: ['#292524', '#44403c', '#57534e', '#78716c', '#a8a29e']
        };
        return palettes[this.palette] || palettes.nordic;
    }

    switchScene(sceneName) {
        this.activeScene = sceneName;
        this.time = 0;
        this.initScene(sceneName);
    }

    initScene(sceneName) {
        switch (sceneName) {
            case 'aurora':
                this.initAurora();
                break;
            case 'rain':
                this.initRain();
                break;
            case 'fireplace':
                this.initEmbers();
                break;
            case 'constellations':
                this.initConstellations();
                break;
            case 'geometric':
                this.initGeometric();
                break;
            default:
                break;
        }
    }

    start() {
        if (!this.animationFrameId) {
            this.loop = this.loop.bind(this);
            this.animationFrameId = requestAnimationFrame(this.loop);
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    loop() {
        this.time += 0.016;
        this.ctx.clearRect(0, 0, this.width, this.height);

        switch (this.activeScene) {
            case 'aurora':
                this.renderAurora();
                break;
            case 'rain':
                this.renderRain();
                break;
            case 'fireplace':
                this.renderFireplace();
                break;
            case 'constellations':
                this.renderConstellations();
                break;
            case 'geometric':
                this.renderGeometric();
                break;
            case 'none':
                // Clean backdrop for gallery/minimal clock mode
                this.renderMinimalBackdrop();
                break;
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    renderMinimalBackdrop() {
        const colors = this.getPaletteColors();
        const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        grad.addColorStop(0, colors[0]);
        grad.addColorStop(1, colors[colors.length - 1]);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // ==========================================
    // 1. SCENE: AURORA BOREALIS / CHROMATIC FLOW
    // ==========================================
    initAurora() {
        this.auroraBlobs = [
            { x: 0.2, y: 0.3, r: 0.45, speedX: 0.4, speedY: 0.3, phase: 0 },
            { x: 0.7, y: 0.4, r: 0.50, speedX: -0.3, speedY: 0.4, phase: 2 },
            { x: 0.4, y: 0.7, r: 0.48, speedX: 0.35, speedY: -0.35, phase: 4 },
            { x: 0.8, y: 0.8, r: 0.42, speedX: -0.25, speedY: -0.3, phase: 1 },
            { x: 0.5, y: 0.5, r: 0.55, speedX: 0.2, speedY: 0.2, phase: 3 }
        ];
    }

    renderAurora() {
        const colors = this.getPaletteColors();
        // Deep background base
        this.ctx.fillStyle = colors[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';

        this.auroraBlobs.forEach((b, i) => {
            const currentX = (b.x + Math.sin(this.time * b.speedX + b.phase) * 0.18) * this.width;
            const currentY = (b.y + Math.cos(this.time * b.speedY + b.phase) * 0.18) * this.height;
            const currentR = (b.r + Math.sin(this.time * 0.5 + i) * 0.08) * Math.max(this.width, this.height);

            const color = colors[(i % (colors.length - 1)) + 1];
            const grad = this.ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, currentR);
            grad.addColorStop(0, this.hexToRgba(color, 0.55));
            grad.addColorStop(0.5, this.hexToRgba(color, 0.25));
            grad.addColorStop(1, 'rgba(0,0,0,0)');

            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(currentX, currentY, currentR, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.ctx.restore();
    }

    // ==========================================
    // 2. SCENE: RAIN ON GLASS WINDOW
    // ==========================================
    initRain() {
        const count = Math.floor(this.width / 16);
        this.raindrops = [];
        for (let i = 0; i < count; i++) {
            this.raindrops.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                len: 12 + Math.random() * 24,
                speed: 8 + Math.random() * 14,
                width: 1.0 + Math.random() * 1.5,
                alpha: 0.25 + Math.random() * 0.45
            });
        }

        // Static condensing glass droplets
        this.condensation = [];
        const glassDropCount = Math.floor(this.width / 24);
        for (let i = 0; i < glassDropCount; i++) {
            this.condensation.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                r: 1.5 + Math.random() * 4,
                slideCountdown: Math.random() * 400,
                sliding: false,
                slideSpeed: 0.5 + Math.random() * 2
            });
        }
    }

    renderRain() {
        // Moody dark rainy glass atmosphere
        const colors = this.getPaletteColors();
        this.ctx.fillStyle = colors[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Subtle background bokeh city lights
        this.ctx.save();
        this.ctx.globalAlpha = 0.18;
        const bokeh = [
            { x: this.width * 0.25, y: this.height * 0.6, r: 90, color: '#f59e0b' },
            { x: this.width * 0.70, y: this.height * 0.4, r: 120, color: '#3b82f6' },
            { x: this.width * 0.50, y: this.height * 0.75, r: 110, color: '#ec4899' },
            { x: this.width * 0.85, y: this.height * 0.7, r: 80, color: '#10b981' }
        ];
        bokeh.forEach(b => {
            const grad = this.ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            grad.addColorStop(0, b.color);
            grad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = grad;
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();

        // Falling rain streaks
        this.ctx.save();
        this.raindrops.forEach(drop => {
            this.ctx.strokeStyle = `rgba(200, 220, 255, ${drop.alpha})`;
            this.ctx.lineWidth = drop.width;
            this.ctx.beginPath();
            this.ctx.moveTo(drop.x, drop.y);
            this.ctx.lineTo(drop.x - 2, drop.y + drop.len);
            this.ctx.stroke();

            drop.y += drop.speed;
            drop.x -= 0.6; // Subtle wind angle
            if (drop.y > this.height) {
                drop.y = -drop.len;
                drop.x = Math.random() * this.width + 50;
            }
        });

        // Glass surface condensation drops
        this.condensation.forEach(c => {
            // Draw drop with glassy highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            this.ctx.fill();

            // Highlight ring
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(c.x - c.r * 0.3, c.y - c.r * 0.3, c.r * 0.4, 0, Math.PI * 2);
            this.ctx.stroke();

            // Slide logic
            c.slideCountdown -= 1;
            if (c.slideCountdown <= 0) {
                c.sliding = true;
            }
            if (c.sliding) {
                c.y += c.slideSpeed;
                // Leave trail
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                this.ctx.fillRect(c.x - 0.5, c.y - 10, 1, 10);

                if (c.y > this.height + 20) {
                    c.y = -10;
                    c.x = Math.random() * this.width;
                    c.sliding = false;
                    c.slideCountdown = 200 + Math.random() * 600;
                }
            }
        });
        this.ctx.restore();
    }

    // ==========================================
    // 3. SCENE: COZY HEARTH & EMBERS
    // ==========================================
    initEmbers() {
        const emberCount = Math.floor(this.width / 18);
        this.embers = [];
        for (let i = 0; i < emberCount; i++) {
            this.embers.push(this.createEmber());
        }
    }

    createEmber() {
        return {
            x: this.width * (0.2 + Math.random() * 0.6),
            y: this.height + Math.random() * 40,
            r: 1.5 + Math.random() * 3.5,
            speedY: 1.2 + Math.random() * 2.5,
            speedX: (Math.random() - 0.5) * 1.2,
            life: 1.0,
            decay: 0.003 + Math.random() * 0.005,
            hue: 15 + Math.random() * 30 // Warm gold to ember orange
        };
    }

    renderFireplace() {
        // Base dark hearth
        this.ctx.fillStyle = '#0a0503';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Dynamic hearth bottom glow
        const flicker = Math.sin(this.time * 8) * 0.05 + Math.cos(this.time * 14) * 0.03;
        const hearthGrad = this.ctx.createRadialGradient(
            this.width * 0.5, this.height, 50,
            this.width * 0.5, this.height, this.height * 0.75
        );
        hearthGrad.addColorStop(0, `rgba(251, 146, 60, ${0.45 + flicker})`);
        hearthGrad.addColorStop(0.3, `rgba(234, 88, 12, ${0.25 + flicker})`);
        hearthGrad.addColorStop(0.7, 'rgba(154, 52, 18, 0.1)');
        hearthGrad.addColorStop(1, 'transparent');

        this.ctx.fillStyle = hearthGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Rising embers
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.embers.length; i++) {
            const e = this.embers[i];
            e.y -= e.speedY;
            e.x += e.speedX + Math.sin(this.time * 2 + i) * 0.6;
            e.life -= e.decay;

            if (e.life <= 0 || e.y < -20) {
                this.embers[i] = this.createEmber();
                continue;
            }

            const alpha = e.life;
            this.ctx.fillStyle = `hsla(${e.hue}, 95%, 60%, ${alpha})`;
            this.ctx.shadowColor = `hsl(${e.hue}, 100%, 50%)`;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(e.x, e.y, e.r * e.life, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    // ==========================================
    // 4. SCENE: COSMIC CONSTELLATIONS
    // ==========================================
    initConstellations() {
        const starCount = Math.floor((this.width * this.height) / 12000);
        this.particles = [];
        for (let i = 0; i < starCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.25,
                r: 1 + Math.random() * 2,
                twinkleSpeed: 1 + Math.random() * 3,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
    }

    renderConstellations() {
        // Deep space background
        const colors = this.getPaletteColors();
        this.ctx.fillStyle = colors[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Nebula glow
        const nebulaGrad = this.ctx.createRadialGradient(
            this.width * 0.6, this.height * 0.4, 20,
            this.width * 0.6, this.height * 0.4, this.width * 0.5
        );
        nebulaGrad.addColorStop(0, this.hexToRgba(colors[2] || '#4338ca', 0.25));
        nebulaGrad.addColorStop(0.6, this.hexToRgba(colors[1] || '#1e1b4b', 0.12));
        nebulaGrad.addColorStop(1, 'transparent');
        this.ctx.fillStyle = nebulaGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw connective constellation lines
        const maxDist = 120;
        this.ctx.save();
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.28;
                    this.ctx.strokeStyle = `rgba(199, 210, 254, ${alpha})`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }

        // Draw and update stars
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;

            const twinkle = 0.4 + 0.6 * Math.sin(this.time * p.twinkleSpeed + p.twinkleOffset);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
            this.ctx.shadowColor = '#ffffff';
            this.ctx.shadowBlur = 4;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    // ==========================================
    // 5. SCENE: GEOMETRIC HARMONY
    // ==========================================
    initGeometric() {
        this.geoRings = [
            { r: 120, speed: 0.15, segments: 6, lineW: 2 },
            { r: 200, speed: -0.12, segments: 8, lineW: 1.5 },
            { r: 290, speed: 0.08, segments: 12, lineW: 1 },
            { r: 380, speed: -0.06, segments: 16, lineW: 1.5 },
            { r: 480, speed: 0.04, segments: 24, lineW: 1 }
        ];
    }

    renderGeometric() {
        const colors = this.getPaletteColors();
        this.ctx.fillStyle = colors[0];
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cx = this.width * 0.5;
        const cy = this.height * 0.5;

        this.ctx.save();
        this.ctx.translate(cx, cy);

        this.geoRings.forEach((ring, idx) => {
            const rot = this.time * ring.speed;
            const color = colors[(idx % (colors.length - 1)) + 1];

            this.ctx.strokeStyle = this.hexToRgba(color, 0.4);
            this.ctx.lineWidth = ring.lineW;

            // Concentric dashed geometric orbital paths
            this.ctx.save();
            this.ctx.rotate(rot);
            this.ctx.setLineDash([20, 15, 5, 15]);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
            this.ctx.stroke();

            // Orbiting nodes
            const nodeCount = 3 + idx;
            for (let n = 0; n < nodeCount; n++) {
                const angle = (Math.PI * 2 / nodeCount) * n + rot * 0.5;
                const nx = Math.cos(angle) * ring.r;
                const ny = Math.sin(angle) * ring.r;

                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(nx, ny, 3 + idx * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        });

        // Center harmonic compass
        this.ctx.rotate(this.time * 0.1);
        this.ctx.strokeStyle = this.hexToRgba(colors[colors.length - 1], 0.7);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    hexToRgba(hex, alpha) {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(ch => ch + ch).join('');
        }
        const num = parseInt(c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

// Global visual engine singleton
window.ambientVisual = null;
