/**
 * Ambient Web Display - Universal Device Adapter with Foldable & Dual-Screen Support
 * Supports Mobile Phones, Foldables (Galaxy Z Fold/Flip, Pixel Fold, Xiaomi Mix Fold, Surface Duo),
 * Tablets, Laptops, and Smart TVs.
 * Features: Auto-detection, Device Posture API, Flex Mode (Tabletop Stand), Wake Lock, and Touch Gestures.
 */

class UniversalDeviceEngine {
    constructor() {
        this.currentProfile = 'auto'; // 'auto', 'mobile', 'foldable', 'tablet', 'laptop', 'tv'
        this.detectedProfile = 'laptop';
        this.effectiveProfile = 'laptop';
        this.isFlexMode = false; // Flex Mode Tabletop (folded ~90 degrees)
        this.foldState = 'unfolded'; // 'unfolded', 'cover', 'flex'
        this.wakeLock = null;
        this.wakeLockEnabled = true;

        // Touch gesture state
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.lastTapTime = 0;

        this.init();
    }

    init() {
        this.initDevicePostureAPI();
        this.detectDevice();
        this.loadSavedProfile();
        this.initResizeAndOrientation();
        this.initScreenWakeLock();
        this.initTouchGestures();
        this.initTvRemoteNavigation();
    }

    /**
     * 1. DEVICE POSTURE API (W3C Standard for Foldables)
     * Detects when a foldable phone (Z Fold, Pixel Fold, Xiaomi Fold) is partially folded
     */
    initDevicePostureAPI() {
        if ('devicePosture' in navigator) {
            this.handlePostureChange(navigator.devicePosture.type);
            navigator.devicePosture.addEventListener('change', () => {
                this.handlePostureChange(navigator.devicePosture.type);
            });
        }
    }

    handlePostureChange(postureType) {
        if (postureType === 'folded' || postureType === 'folding') {
            this.setFlexMode(true);
            if (this.currentProfile === 'auto') {
                this.effectiveProfile = 'foldable';
                this.applyProfileClasses();
                this.updateProfileUI();
            }
        } else if (postureType === 'continuous') {
            // Unfolded flat
            if (this.isFlexMode && this.currentProfile === 'auto') {
                this.setFlexMode(false);
            }
        }
    }

    /**
     * 2. COMPREHENSIVE DEVICE DETECTION
     * Identifies Foldables (Inner Screen & Cover Screen), Phones, Tablets, Laptops, and TVs
     */
    detectDevice() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        const userAgent = navigator.userAgent.toLowerCase();
        const aspect = width / height;

        const isMobileUA = /android|iphone|ipod|windows phone/i.test(userAgent);
        const isTabletUA = /ipad|tablet/i.test(userAgent);
        const isTvUA = /smart-tv|googletv|appletv|hbbtv|pov_tv|netcast.tv|viera|roku|tizen/i.test(userAgent);

        // Foldable detection heuristics:
        // 1. Z Fold / Pixel Fold / Xiaomi Mix Fold unfolded: near-square aspect ratio (~0.8 to 1.3) on mobile/touch screen
        // 2. Foldable cover screens: ultra tall & narrow (aspect ratio < 0.48 or > 2.15)
        const isFoldableInner = isTouch && (aspect >= 0.75 && aspect <= 1.33) && Math.min(width, height) >= 540 && Math.min(width, height) <= 1100;
        const isFoldableCover = isTouch && (height / width > 2.15 || width / height > 2.2);
        const isSurfaceDuo = isTouch && ('visualViewport' in window) && (window.visualViewport.segments && window.visualViewport.segments.length > 1);

        if (isTvUA || (!isTouch && width >= 1920 && height >= 1080 && window.devicePixelRatio <= 1.25)) {
            this.detectedProfile = 'tv';
        } else if (isFoldableInner || isFoldableCover || isSurfaceDuo) {
            this.detectedProfile = 'foldable';
            this.foldState = isFoldableCover ? 'cover' : 'unfolded';
        } else if (isTabletUA || (isTouch && width >= 600 && width <= 1024 && !isFoldableInner)) {
            this.detectedProfile = 'tablet';
        } else if (isMobileUA || (isTouch && (width < 600 || height < 500))) {
            this.detectedProfile = 'mobile';
        } else {
            this.detectedProfile = 'laptop';
        }

        return this.detectedProfile;
    }

    loadSavedProfile() {
        const saved = localStorage.getItem('ambient_device_profile') || 'auto';
        const savedFlex = localStorage.getItem('ambient_flex_mode') === 'true';
        this.setProfile(saved);
        if (savedFlex) this.setFlexMode(true);
    }

    setProfile(profile) {
        this.currentProfile = profile;
        localStorage.setItem('ambient_device_profile', profile);

        if (profile === 'auto') {
            this.detectDevice();
            this.effectiveProfile = this.detectedProfile;
        } else {
            this.effectiveProfile = profile;
        }

        this.applyProfileClasses();
        this.updateProfileUI();
    }

    /**
     * Flex Mode / Tabletop Stand
     * Allows Galaxy Z Fold/Flip, Pixel Fold, and Xiaomi Fold to bend 90 degrees on a desk
     */
    toggleFlexMode() {
        this.setFlexMode(!this.isFlexMode);
    }

    setFlexMode(enabled) {
        this.isFlexMode = enabled;
        localStorage.setItem('ambient_flex_mode', enabled ? 'true' : 'false');
        this.applyProfileClasses();
        this.updateProfileUI();
    }

    applyProfileClasses() {
        const stage = document.getElementById('ambient-stage');
        if (!stage) return;

        // Remove all profile classes
        stage.classList.remove('mode-mobile', 'mode-tablet', 'mode-laptop', 'mode-tv', 'mode-foldable');
        stage.classList.add(`mode-${this.effectiveProfile}`);

        // Flex Mode Tabletop class
        stage.classList.toggle('flex-mode-active', this.isFlexMode);

        // Foldable sub-states (cover vs unfolded)
        stage.classList.toggle('foldable-cover', this.foldState === 'cover');
        stage.classList.toggle('foldable-unfolded', this.foldState === 'unfolded');

        // Orientation class (portrait vs landscape)
        const isLandscape = window.innerWidth > window.innerHeight;
        stage.classList.toggle('orientation-landscape', isLandscape);
        stage.classList.toggle('orientation-portrait', !isLandscape);
    }

    updateProfileUI() {
        // Sync active state in drawer / selector buttons
        document.querySelectorAll('.profile-select-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.profile === this.currentProfile);
        });

        // Update header badge text and icon
        const badgeText = document.getElementById('device-profile-name');
        if (badgeText) {
            const labels = {
                auto: `Auto (${this.capitalize(this.effectiveProfile)})`,
                mobile: '📱 Phone',
                foldable: '📐 Foldable',
                tablet: '📟 Tablet',
                laptop: '💻 Laptop',
                tv: '📺 TV'
            };
            badgeText.textContent = labels[this.currentProfile] || labels.auto;
        }

        // Show/hide Flex Mode Tabletop toggle pill
        const flexPill = document.getElementById('btn-flex-toggle');
        if (flexPill) {
            const isFoldableOrMobile = this.effectiveProfile === 'foldable' || this.effectiveProfile === 'mobile';
            flexPill.style.display = isFoldableOrMobile ? 'inline-flex' : 'none';
            flexPill.classList.toggle('active', this.isFlexMode);
            const flexLabel = flexPill.querySelector('.flex-label');
            if (flexLabel) {
                flexLabel.textContent = this.isFlexMode ? "Flex Mode: ON" : "Flex Mode";
            }
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    initResizeAndOrientation() {
        const handleResize = () => {
            if (this.currentProfile === 'auto') {
                this.detectDevice();
                this.effectiveProfile = this.detectedProfile;
            }
            this.applyProfileClasses();
            this.updateProfileUI();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 150);
        });
    }

    /**
     * 3. SCREEN WAKE LOCK API
     */
    async initScreenWakeLock() {
        if (!('wakeLock' in navigator)) {
            const wakeBadge = document.getElementById('wake-lock-badge');
            if (wakeBadge) wakeBadge.style.display = 'none';
            return;
        }

        this.requestWakeLock();

        document.addEventListener('visibilitychange', async () => {
            if (this.wakeLock !== null && document.visibilityState === 'visible') {
                await this.requestWakeLock();
            }
        });
    }

    async requestWakeLock() {
        if (!this.wakeLockEnabled || !('wakeLock' in navigator)) return;
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.updateWakeLockUI(true);

            this.wakeLock.addEventListener('release', () => {
                this.updateWakeLockUI(false);
            });
        } catch (err) {
            this.updateWakeLockUI(false);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release().catch(() => {});
            this.wakeLock = null;
            this.updateWakeLockUI(false);
        }
    }

    toggleWakeLock(enable) {
        this.wakeLockEnabled = enable;
        if (enable) {
            this.requestWakeLock();
        } else {
            this.releaseWakeLock();
        }
    }

    updateWakeLockUI(isActive) {
        const badge = document.getElementById('wake-lock-badge');
        if (badge) {
            badge.classList.toggle('active', isActive);
            badge.title = isActive ? "Screen Wake Lock Active (Screen will not sleep)" : "Screen Wake Lock Inactive";
        }
    }

    /**
     * 4. TOUCH GESTURES ENGINE FOR PHONES, FOLDABLES & TABLETS
     */
    initTouchGestures() {
        const stage = document.getElementById('ambient-stage');
        if (!stage) return;

        stage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                this.touchEndX = e.changedTouches[0].clientX;
                this.touchEndY = e.changedTouches[0].clientY;
                this.handleGesture();
            }

            // Double tap to toggle Fullscreen
            const currentTime = new Date().getTime();
            const tapLength = currentTime - this.lastTapTime;
            if (tapLength < 300 && tapLength > 50) {
                if (window.app && window.app.toggleFullscreen) {
                    window.app.toggleFullscreen();
                }
            }
            this.lastTapTime = currentTime;
        }, { passive: true });
    }

    handleGesture() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        const threshold = 55;

        if (absX > threshold && absX > absY) {
            // Horizontal swipe: change artwork or visual scenes
            if (deltaX < 0) {
                if (window.app && window.app.mode === 'art' && window.ambientArt) {
                    window.ambientArt.next();
                } else if (window.ambientVisual) {
                    this.cycleNextScene();
                }
            } else {
                if (window.app && window.app.mode === 'art' && window.ambientArt) {
                    window.ambientArt.prev();
                } else if (window.ambientVisual) {
                    this.cyclePrevScene();
                }
            }
        } else if (absY > threshold && absY > absX) {
            // Vertical swipe: open/close drawer
            if (deltaY > 0) {
                if (window.app && !window.app.isDrawerOpen) window.app.openDrawer();
            } else {
                if (window.app && window.app.isDrawerOpen) window.app.closeDrawer();
            }
        }
    }

    cycleNextScene() {
        const scenes = ['aurora', 'rain', 'fireplace', 'constellations', 'geometric'];
        const currentIdx = scenes.indexOf(window.ambientVisual.activeScene);
        const nextScene = scenes[(currentIdx + 1) % scenes.length];
        window.ambientVisual.switchScene(nextScene);
        this.updateSceneActiveBtn(nextScene);
    }

    cyclePrevScene() {
        const scenes = ['aurora', 'rain', 'fireplace', 'constellations', 'geometric'];
        const currentIdx = scenes.indexOf(window.ambientVisual.activeScene);
        const prevScene = scenes[(currentIdx - 1 + scenes.length) % scenes.length];
        window.ambientVisual.switchScene(prevScene);
        this.updateSceneActiveBtn(prevScene);
    }

    updateSceneActiveBtn(sceneName) {
        document.querySelectorAll('.scene-select-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.scene === sceneName);
        });
    }

    /**
     * 5. SMART TV REMOTE D-PAD NAVIGATION
     */
    initTvRemoteNavigation() {
        window.addEventListener('keydown', (e) => {
            if (this.effectiveProfile !== 'tv') return;

            if (e.key === 'MediaPlayPause' || e.keyCode === 179) {
                if (window.app) window.app.toggleSound();
            }
        });
    }
}

// Global device engine singleton
window.ambientDevice = null;
