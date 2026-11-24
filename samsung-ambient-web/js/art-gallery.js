/**
 * Ambient Web Display - Art Gallery & Matte Frame Engine
 * Museum masterpieces, custom photo upload, and realistic Frame TV matting
 */

class AmbientArtGallery {
    constructor() {
        this.currentIndex = 0;
        this.frameStyle = 'classic-wide'; // modern-thin, classic-wide, shadowbox, frameless
        this.matColor = 'warm-ivory'; // polar-white, warm-ivory, midnight-charcoal, sand-beige
        this.kenBurnsEnabled = true;
        this.slideshowInterval = 30; // seconds
        this.slideshowTimer = null;
        this.isCustomPhotoActive = false;
        this.customPhotos = [];
        this.aiArtworks = [];

        // Curated masterworks collection (Public Domain high-res URLs with procedural fallback)
        this.curatedArtworks = [
            {
                title: "The Starry Night",
                artist: "Vincent van Gogh",
                year: "1889",
                medium: "Oil on canvas",
                museum: "Museum of Modern Art, New York",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg",
                fallbackGradient: "radial-gradient(circle at 70% 30%, #fef08a 5%, #1e3a8a 35%, #0f172a 75%)"
            },
            {
                title: "The Great Wave off Kanagawa",
                artist: "Katsushika Hokusai",
                year: "c. 1831",
                medium: "Color woodblock print",
                museum: "Tokyo National Museum",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg",
                fallbackGradient: "linear-gradient(135deg, #f8fafc 15%, #0284c7 40%, #0369a1 70%, #1e293b 100%)"
            },
            {
                title: "Water Lilies",
                artist: "Claude Monet",
                year: "1916",
                medium: "Oil on canvas",
                museum: "Musée de l'Orangerie, Paris",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg/1280px-Claude_Monet_-_Water_Lilies_-_Google_Art_Project.jpg",
                fallbackGradient: "linear-gradient(45deg, #065f46 20%, #10b981 50%, #6ee7b7 80%, #f472b6 95%)"
            },
            {
                title: "Wanderer above the Sea of Fog",
                artist: "Caspar David Friedrich",
                year: "1818",
                medium: "Oil on canvas",
                museum: "Hamburger Kunsthalle",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/1024px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg",
                fallbackGradient: "linear-gradient(to top, #1e293b 30%, #64748b 60%, #cbd5e1 90%)"
            },
            {
                title: "Almond Blossoms",
                artist: "Vincent van Gogh",
                year: "1890",
                medium: "Oil on canvas",
                museum: "Van Gogh Museum, Amsterdam",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg/1280px-Vincent_van_Gogh_-_Almond_blossom_-_Google_Art_Project.jpg",
                fallbackGradient: "radial-gradient(ellipse at center, #38bdf8 0%, #0284c7 60%, #075985 100%)"
            },
            {
                title: "Composition with Red, Blue and Yellow",
                artist: "Piet Mondrian",
                year: "1930",
                medium: "Oil on canvas",
                museum: "Kunsthaus Zürich",
                url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Piet_Mondrian%2C_1930_-_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/1024px-Piet_Mondrian%2C_1930_-_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg",
                fallbackGradient: "linear-gradient(90deg, #dc2626 50%, #f8fafc 50%)"
            }
        ];

        this.init();
    }

    init() {
        this.renderCurrentArtwork();
        this.startSlideshow();
        this.initUploadHandler();
    }

    getCurrentList() {
        if (this.isCustomPhotoActive && this.customPhotos.length > 0) {
            return this.customPhotos;
        }
        return [...this.aiArtworks, ...this.curatedArtworks];
    }

    addAiGeneratedArtwork(artwork) {
        this.aiArtworks.unshift(artwork);
        this.isCustomPhotoActive = false;
        this.currentIndex = 0;
        this.renderCurrentArtwork();
    }

    renderCurrentArtwork() {
        const list = this.getCurrentList();
        if (list.length === 0) return;
        const art = list[this.currentIndex % list.length];

        const imgEl = document.getElementById('frame-art-image');
        const titleEl = document.getElementById('art-plaque-title');
        const artistEl = document.getElementById('art-plaque-artist');
        const metaEl = document.getElementById('art-plaque-meta');

        if (!imgEl) return;

        // Reset Ken Burns animation smoothly
        imgEl.classList.remove('ken-burns');
        void imgEl.offsetWidth; // Force CSS reflow

        // Preload image or render SVG/data URL directly
        if (art.isAiGenerated && art.url) {
            imgEl.style.backgroundImage = `url("${art.url}")`;
            imgEl.style.backgroundColor = art.palette ? art.palette[0] : '#0f172a';
            if (this.kenBurnsEnabled) {
                imgEl.classList.add('ken-burns');
            }
        } else {
            const tempImg = new Image();
            tempImg.onload = () => {
                imgEl.style.backgroundImage = `url("${art.url}")`;
                imgEl.style.backgroundColor = 'transparent';
                if (this.kenBurnsEnabled) {
                    imgEl.classList.add('ken-burns');
                }
            };
            tempImg.onerror = () => {
                imgEl.style.backgroundImage = art.fallbackGradient || 'linear-gradient(135deg, #1e293b, #0f172a)';
            };
            tempImg.src = art.url;
        }

        if (titleEl) {
            titleEl.innerHTML = art.isAiGenerated 
                ? `${art.title} <span class="ai-sparkle-tag">✨ Gemini AI</span>` 
                : art.title;
        }
        if (artistEl) artistEl.textContent = art.artist;
        if (metaEl) {
            metaEl.textContent = art.isAiGenerated 
                ? `${art.year} • ${art.medium} • Firebase AI Logic` 
                : `${art.year} • ${art.medium || 'Curated Masterpiece'}`;
        }

        this.applyFrameStyle();
    }

    setFrameStyle(style) {
        this.frameStyle = style;
        this.applyFrameStyle();
    }

    setMatColor(color) {
        this.matColor = color;
        this.applyFrameStyle();
    }

    applyFrameStyle() {
        const frameBox = document.getElementById('frame-box');
        if (!frameBox) return;

        // Remove old classes
        frameBox.className = 'frame-box';
        frameBox.classList.add(`frame-${this.frameStyle}`);
        frameBox.classList.add(`mat-${this.matColor}`);
    }

    toggleKenBurns(enabled) {
        this.kenBurnsEnabled = enabled;
        const imgEl = document.getElementById('frame-art-image');
        if (imgEl) {
            if (enabled) {
                imgEl.classList.add('ken-burns');
            } else {
                imgEl.classList.remove('ken-burns');
            }
        }
    }

    next() {
        const list = this.getCurrentList();
        this.currentIndex = (this.currentIndex + 1) % list.length;
        this.renderCurrentArtwork();
    }

    prev() {
        const list = this.getCurrentList();
        this.currentIndex = (this.currentIndex - 1 + list.length) % list.length;
        this.renderCurrentArtwork();
    }

    startSlideshow() {
        this.stopSlideshow();
        if (this.slideshowInterval > 0) {
            this.slideshowTimer = setInterval(() => {
                this.next();
            }, this.slideshowInterval * 1000);
        }
    }

    stopSlideshow() {
        if (this.slideshowTimer) {
            clearInterval(this.slideshowTimer);
            this.slideshowTimer = null;
        }
    }

    setSlideshowInterval(seconds) {
        this.slideshowInterval = seconds;
        this.startSlideshow();
    }

    initUploadHandler() {
        const fileInput = document.getElementById('photo-upload-input');
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.customPhotos.push({
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        artist: "My Gallery",
                        year: new Date().getFullYear().toString(),
                        medium: "Digital Photography",
                        url: event.target.result
                    });
                    if (index === files.length - 1) {
                        this.isCustomPhotoActive = true;
                        this.currentIndex = this.customPhotos.length - 1;
                        this.renderCurrentArtwork();
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }

    useCuratedGallery() {
        this.isCustomPhotoActive = false;
        this.currentIndex = 0;
        this.renderCurrentArtwork();
    }
}

// Global art singleton
window.ambientArt = null;
