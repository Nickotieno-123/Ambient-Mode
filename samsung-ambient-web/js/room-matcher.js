/**
 * Ambient Web Display - Room Wall Matcher & Burn-in Protection
 * Blends display into room walls and provides OLED pixel-shift protection
 */

class RoomWallMatcher {
    constructor() {
        this.wallColor = '#1e293b';
        this.pixelShiftEnabled = true;
        this.circadianNightDimEnabled = true;
        this.pixelShiftInterval = null;
        this.currentShiftX = 0;
        this.currentShiftY = 0;

        this.init();
    }

    init() {
        this.initWallPresets();
        this.initColorInput();
        this.initWallImageSampler();
        this.startPixelShift();
        this.checkCircadianDim();
        setInterval(() => this.checkCircadianDim(), 60000);
    }

    setWallColor(colorHex) {
        this.wallColor = colorHex;
        document.documentElement.style.setProperty('--ambient-wall-bg', colorHex);
        
        // Also tint visual engine palette if appropriate
        if (window.ambientVisual) {
            // Apply subtle ambient room reflection
            const stage = document.getElementById('ambient-stage');
            if (stage) {
                stage.style.backgroundColor = colorHex;
            }
        }
    }

    initWallPresets() {
        document.querySelectorAll('.wall-color-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                this.setWallColor(color);
                document.querySelectorAll('.wall-color-pill').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    initColorInput() {
        const picker = document.getElementById('wall-color-picker');
        if (picker) {
            picker.addEventListener('input', (e) => {
                this.setWallColor(e.target.value);
            });
        }
    }

    initWallImageSampler() {
        const samplerInput = document.getElementById('wall-photo-input');
        if (!samplerInput) return;

        samplerInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 100;
                    canvas.height = 100;
                    ctx.drawImage(img, 0, 0, 100, 100);

                    // Sample average center colors (ignoring extreme outliers)
                    const imgData = ctx.getImageData(25, 25, 50, 50).data;
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < imgData.length; i += 4) {
                        r += imgData[i];
                        g += imgData[i + 1];
                        b += imgData[i + 2];
                        count++;
                    }
                    r = Math.round(r / count);
                    g = Math.round(g / count);
                    b = Math.round(b / count);

                    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                    this.setWallColor(hex);

                    const picker = document.getElementById('wall-color-picker');
                    if (picker) picker.value = hex;

                    const status = document.getElementById('wall-sample-status');
                    if (status) {
                        status.textContent = `Matched Room Wall: ${hex}`;
                        status.style.display = 'block';
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Samsung Ambient OLED / LCD Burn-in Protection
     * Drifts screen elements by 2-4px every 60 seconds
     */
    startPixelShift() {
        this.stopPixelShift();
        if (!this.pixelShiftEnabled) return;

        this.pixelShiftInterval = setInterval(() => {
            // Subtle offset: -3 to +3 pixels
            this.currentShiftX = (Math.random() - 0.5) * 6;
            this.currentShiftY = (Math.random() - 0.5) * 6;

            const target = document.getElementById('ambient-stage');
            if (target) {
                target.style.transform = `translate(${this.currentShiftX}px, ${this.currentShiftY}px)`;
            }
        }, 60000);
    }

    stopPixelShift() {
        if (this.pixelShiftInterval) {
            clearInterval(this.pixelShiftInterval);
            this.pixelShiftInterval = null;
        }
        const target = document.getElementById('ambient-stage');
        if (target) {
            target.style.transform = 'translate(0px, 0px)';
        }
    }

    togglePixelShift(enabled) {
        this.pixelShiftEnabled = enabled;
        if (enabled) {
            this.startPixelShift();
        } else {
            this.stopPixelShift();
        }
    }

    /**
     * Circadian Night Dimmer
     * Dims screen after 21:00 (9PM) and shifts to warm tint
     */
    checkCircadianDim() {
        if (!this.circadianNightDimEnabled) {
            document.body.classList.remove('circadian-night-dim');
            return;
        }
        const hour = new Date().getHours();
        const isNight = hour >= 21 || hour < 6;
        if (isNight) {
            document.body.classList.add('circadian-night-dim');
        } else {
            document.body.classList.remove('circadian-night-dim');
        }
    }

    toggleCircadianDim(enabled) {
        this.circadianNightDimEnabled = enabled;
        this.checkCircadianDim();
    }
}

// Global room matcher singleton
window.ambientRoom = null;
