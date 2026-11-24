/**
 * Ambient Web Display - Main App Controller
 * Orchestrates modes, auto-hiding TV controls, shortcuts, and settings drawer
 */

class AmbientApp {
    constructor() {
        this.mode = 'decor'; // 'decor', 'clock', 'art', 'relax'
        this.idleTimeout = null;
        this.idleDelay = 3500; // 3.5 seconds
        this.isDrawerOpen = false;
        this.isSoundPlaying = false;

        this.init();
    }

    init() {
        // Initialize sub-engines
        window.ambientVisual = new AmbientVisualEngine('ambient-canvas');
        window.ambientClock = new AmbientClockWeather();
        window.ambientArt = new AmbientArtGallery();
        window.ambientRoom = new RoomWallMatcher();
        window.ambientLaptop = new LaptopDeskEngine();
        window.ambientDevice = new UniversalDeviceEngine();

        // Start visual canvas
        window.ambientVisual.start();

        // Initialize Firebase & Gen AI
        if (window.firebaseService) {
            window.firebaseService.init();
        }

        this.bindEvents();
        this.bindKeyboardShortcuts();
        this.initAutoDimTimer();
        this.switchMode('decor');
    }

    switchMode(newMode) {
        this.mode = newMode;

        // Update nav dock buttons
        document.querySelectorAll('.dock-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });

        const canvasEl = document.getElementById('ambient-canvas');
        const frameBox = document.getElementById('frame-container');
        const clocksContainer = document.getElementById('clocks-container');
        const weatherBadge = document.getElementById('ambient-header');
        const aiStudioSection = document.getElementById('ai-studio-container');

        if (aiStudioSection) aiStudioSection.style.display = 'none';

        switch (newMode) {
            case 'decor':
                // Beautiful fluid visual canvas + minimal time badge
                canvasEl.style.display = 'block';
                frameBox.style.display = 'none';
                clocksContainer.style.display = 'flex';
                weatherBadge.style.display = 'flex';
                window.ambientVisual.switchScene('aurora');
                window.ambientClock.setClockStyle('minimal');
                break;

            case 'clock':
                // Full featured smart clock display with weather & zen quote
                canvasEl.style.display = 'block';
                frameBox.style.display = 'none';
                clocksContainer.style.display = 'flex';
                weatherBadge.style.display = 'flex';
                window.ambientVisual.switchScene('none'); // clean subtle background
                break;

            case 'art':
                // Samsung The Frame TV museum mode
                canvasEl.style.display = 'none';
                frameBox.style.display = 'flex';
                clocksContainer.style.display = 'none';
                weatherBadge.style.display = 'none';
                window.ambientArt.renderCurrentArtwork();
                break;

            case 'ai-studio':
                // Firebase Gen AI Studio (Vertex AI Logic)
                canvasEl.style.display = 'block';
                frameBox.style.display = 'none';
                clocksContainer.style.display = 'none';
                weatherBadge.style.display = 'flex';
                if (aiStudioSection) aiStudioSection.style.display = 'flex';
                window.ambientVisual.switchScene('aurora');
                break;

            case 'relax':
                // Calming nature visuals with ambient soundscape
                canvasEl.style.display = 'block';
                frameBox.style.display = 'none';
                clocksContainer.style.display = 'flex';
                weatherBadge.style.display = 'flex';
                window.ambientVisual.switchScene('rain');
                window.ambientClock.setClockStyle('minimal');
                if (!this.isSoundPlaying) {
                    this.toggleSound('rain');
                }
                break;
        }
    }

    toggleSound(soundType = 'rain') {
        if (!this.isSoundPlaying) {
            window.ambientAudio.switchSound(soundType);
            this.isSoundPlaying = true;
            this.updateSoundButtonUI(true);
        } else {
            window.ambientAudio.switchSound('none');
            this.isSoundPlaying = false;
            this.updateSoundButtonUI(false);
        }
    }

    updateSoundButtonUI(isPlaying) {
        const soundBtn = document.getElementById('btn-quick-sound');
        if (soundBtn) {
            soundBtn.classList.toggle('playing', isPlaying);
            const iconSpan = soundBtn.querySelector('.sound-icon');
            if (iconSpan) {
                iconSpan.innerHTML = isPlaying 
                    ? `<svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z"/></svg>`
                    : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`;
            }
        }
    }

    bindEvents() {
        // Mode buttons
        document.querySelectorAll('.dock-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchMode(btn.dataset.mode);
            });
        });

        // Quick Sound Toggle button
        const quickSoundBtn = document.getElementById('btn-quick-sound');
        if (quickSoundBtn) {
            quickSoundBtn.addEventListener('click', () => {
                const currentScene = window.ambientVisual.activeScene;
                let sound = 'rain';
                if (currentScene === 'fireplace') sound = 'fireplace';
                else if (currentScene === 'constellations') sound = 'drone';
                this.toggleSound(sound);
            });
        }

        // Quick Fullscreen button
        const fsBtn = document.getElementById('btn-fullscreen');
        if (fsBtn) {
            fsBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // Settings Drawer open/close
        const settingsBtn = document.getElementById('btn-settings');
        const closeDrawerBtn = document.getElementById('btn-close-drawer');
        const drawerBackdrop = document.getElementById('drawer-backdrop');

        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openDrawer());
        if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => this.closeDrawer());
        if (drawerBackdrop) drawerBackdrop.addEventListener('click', () => this.closeDrawer());

        // Tab switching inside Settings Drawer
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const targetPanel = document.getElementById(`panel-${btn.dataset.tab}`);
                if (targetPanel) targetPanel.classList.add('active');
            });
        });

        // Scene selector buttons in drawer
        document.querySelectorAll('.scene-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.scene-select-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const scene = btn.dataset.scene;
                window.ambientVisual.switchScene(scene);
            });
        });

        // Palette selector buttons in drawer
        document.querySelectorAll('.palette-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.palette-select-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.ambientVisual.setPalette(btn.dataset.palette);
            });
        });

        // Clock style buttons in drawer
        document.querySelectorAll('.clock-style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.clock-style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.ambientClock.setClockStyle(btn.dataset.style);
            });
        });

        // Frame style buttons in drawer
        document.querySelectorAll('.frame-style-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.frame-style-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.ambientArt.setFrameStyle(btn.dataset.frame);
            });
        });

        // Mat color buttons in drawer
        document.querySelectorAll('.mat-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mat-color-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.ambientArt.setMatColor(btn.dataset.mat);
            });
        });

        // Soundscape radio selections
        document.querySelectorAll('.soundscape-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.soundscape-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                const sound = card.dataset.sound;
                window.ambientAudio.switchSound(sound);
                this.isSoundPlaying = (sound !== 'none');
                this.updateSoundButtonUI(this.isSoundPlaying);
            });
        });

        // Sound volume slider
        const volSlider = document.getElementById('sound-volume-slider');
        if (volSlider) {
            volSlider.addEventListener('input', (e) => {
                window.ambientAudio.setVolume(parseFloat(e.target.value));
            });
        }

        // Brightness slider
        const brightSlider = document.getElementById('brightness-slider');
        if (brightSlider) {
            brightSlider.addEventListener('input', (e) => {
                const val = e.target.value;
                document.getElementById('ambient-stage').style.filter = `brightness(${val}%)`;
            });
        }

        // Format & unit toggles
        const timeFormatToggle = document.getElementById('toggle-time-format');
        if (timeFormatToggle) {
            timeFormatToggle.addEventListener('change', (e) => {
                window.ambientClock.setTimeFormat(e.target.checked ? '24' : '12');
            });
        }

        const secToggle = document.getElementById('toggle-show-seconds');
        if (secToggle) {
            secToggle.addEventListener('change', (e) => {
                window.ambientClock.toggleSeconds(e.target.checked);
            });
        }

        const tempUnitToggle = document.getElementById('toggle-temp-unit');
        if (tempUnitToggle) {
            tempUnitToggle.addEventListener('change', (e) => {
                window.ambientClock.setTempUnit(e.target.checked ? 'fahrenheit' : 'celsius');
            });
        }

        const burnInToggle = document.getElementById('toggle-pixel-shift');
        if (burnInToggle) {
            burnInToggle.addEventListener('change', (e) => {
                window.ambientRoom.togglePixelShift(e.target.checked);
            });
        }

        const nightDimToggle = document.getElementById('toggle-night-dim');
        if (nightDimToggle) {
            nightDimToggle.addEventListener('change', (e) => {
                window.ambientRoom.toggleCircadianDim(e.target.checked);
            });
        }

        const kenBurnsToggle = document.getElementById('toggle-ken-burns');
        if (kenBurnsToggle) {
            kenBurnsToggle.addEventListener('change', (e) => {
                window.ambientArt.toggleKenBurns(e.target.checked);
            });
        }

        // Art next / prev
        const btnNextArt = document.getElementById('btn-next-art');
        const btnPrevArt = document.getElementById('btn-prev-art');
        if (btnNextArt) btnNextArt.addEventListener('click', () => window.ambientArt.next());
        if (btnPrevArt) btnPrevArt.addEventListener('click', () => window.ambientArt.prev());

        // Universal Device Profile Cycling (Header & Settings)
        const deviceToggleBtn = document.getElementById('btn-device-toggle');
        if (deviceToggleBtn) {
            deviceToggleBtn.addEventListener('click', () => {
                this.cycleDeviceProfile();
            });
        }

        document.querySelectorAll('.profile-select-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const profile = btn.dataset.profile;
                window.ambientDevice.setProfile(profile);
            });
        });

        // Foldable Flex Mode Tabletop Button & Drawer Switch
        const btnFlex = document.getElementById('btn-flex-toggle');
        if (btnFlex) {
            btnFlex.addEventListener('click', () => {
                window.ambientDevice.toggleFlexMode();
                this.syncFlexModeUI();
            });
        }

        const toggleFlexDrawer = document.getElementById('toggle-flex-mode');
        if (toggleFlexDrawer) {
            toggleFlexDrawer.addEventListener('change', (e) => {
                window.ambientDevice.setFlexMode(e.target.checked);
            });
        }

        // Screen Wake Lock Toggle (Header Badge & Settings Switch)
        const wakeToggle = document.getElementById('toggle-wake-lock');
        if (wakeToggle) {
            wakeToggle.addEventListener('change', (e) => {
                window.ambientDevice.toggleWakeLock(e.target.checked);
            });
        }

        const wakeBadge = document.getElementById('wake-lock-badge');
        if (wakeBadge) {
            wakeBadge.addEventListener('click', () => {
                const nextState = !window.ambientDevice.wakeLockEnabled;
                window.ambientDevice.toggleWakeLock(nextState);
                if (wakeToggle) wakeToggle.checked = nextState;
            });
        }

        // Desk Card Tabs (Focus, Tasks, Sounds)
        document.querySelectorAll('.desk-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.desk-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.desk-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                const target = document.getElementById(`desk-panel-${btn.dataset.tab}`);
                if (target) target.classList.add('active');
            });
        });

        // Desk Quick Soundscape Buttons
        document.querySelectorAll('.desk-sound-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sound = btn.dataset.sound;
                window.ambientAudio.switchSound(sound);
                this.isSoundPlaying = (sound !== 'none');
                this.updateSoundButtonUI(this.isSoundPlaying);
            });
        });

        // Shortcuts Modal
        const btnShortcutsHelp = document.getElementById('btn-shortcuts-help');
        const btnCloseShortcuts = document.getElementById('btn-close-shortcuts-modal');
        const shortcutsBackdrop = document.getElementById('shortcuts-modal-backdrop');

        if (btnShortcutsHelp) btnShortcutsHelp.addEventListener('click', () => this.openShortcutsModal());
        if (btnCloseShortcuts) btnCloseShortcuts.addEventListener('click', () => this.closeShortcutsModal());
        if (shortcutsBackdrop) {
            shortcutsBackdrop.addEventListener('click', (e) => {
                if (e.target === shortcutsBackdrop) this.closeShortcutsModal();
            });
        }

        // Firebase Vertex AI Studio Generator
        let selectedAiMood = 'ethereal_aurora';
        document.querySelectorAll('.ai-mood-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.ai-mood-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                selectedAiMood = pill.dataset.mood;
            });
        });

        const btnGenerateAi = document.getElementById('btn-generate-ai-art');
        const aiPromptInput = document.getElementById('ai-art-prompt');
        const aiStatusBanner = document.getElementById('ai-gen-status');

        if (btnGenerateAi && aiPromptInput) {
            btnGenerateAi.addEventListener('click', async () => {
                const promptText = aiPromptInput.value.trim();
                btnGenerateAi.disabled = true;
                if (aiStatusBanner) aiStatusBanner.style.display = 'flex';

                try {
                    if (window.firebaseService) {
                        const artwork = await window.firebaseService.generateAiArtwork(promptText, selectedAiMood);
                        if (window.ambientArt) {
                            window.ambientArt.addAiGeneratedArtwork(artwork);
                        }
                        // Automatically switch to The Frame Art mode to display the new AI masterpiece!
                        this.switchMode('art');
                    }
                } catch (err) {
                    console.error("AI Art generation error:", err);
                    alert("Could not generate artwork: " + err.message);
                } finally {
                    btnGenerateAi.disabled = false;
                    if (aiStatusBanner) aiStatusBanner.style.display = 'none';
                }
            });

            aiPromptInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') btnGenerateAi.click();
            });
        }

        // Firebase Auth Buttons
        const userAuthBtn = document.getElementById('btn-user-auth');
        const drawerGoogleLogin = document.getElementById('btn-drawer-google-login');
        const drawerLogout = document.getElementById('btn-drawer-logout');

        if (userAuthBtn) {
            userAuthBtn.addEventListener('click', () => {
                if (window.firebaseService) {
                    if (window.firebaseService.currentUser && !window.firebaseService.currentUser.isAnonymous) {
                        this.openDrawer();
                        document.querySelector('.settings-tab-btn[data-tab="firebase"]')?.click();
                    } else {
                        window.firebaseService.signInWithGoogle();
                    }
                }
            });
        }

        if (drawerGoogleLogin) {
            drawerGoogleLogin.addEventListener('click', () => {
                window.firebaseService?.signInWithGoogle();
            });
        }

        if (drawerLogout) {
            drawerLogout.addEventListener('click', () => {
                window.firebaseService?.signOutUser();
            });
        }

        // Custom Firebase Config Save
        const btnSaveConfig = document.getElementById('btn-save-firebase-config');
        const txtConfig = document.getElementById('firebase-config-json');
        if (btnSaveConfig && txtConfig) {
            btnSaveConfig.addEventListener('click', () => {
                try {
                    const parsed = JSON.parse(txtConfig.value);
                    localStorage.setItem('ambient_custom_firebase_config', JSON.stringify(parsed));
                    alert("Custom Firebase configuration saved! Reloading...");
                    location.reload();
                } catch (e) {
                    alert("Invalid JSON format. Please paste a valid JSON object.");
                }
            });
        }
    }

    cycleDeviceProfile() {
        const profiles = ['auto', 'mobile', 'foldable', 'tablet', 'laptop', 'tv'];
        const current = window.ambientDevice.currentProfile;
        const nextIdx = (profiles.indexOf(current) + 1) % profiles.length;
        window.ambientDevice.setProfile(profiles[nextIdx]);
        this.syncFlexModeUI();
    }

    syncFlexModeUI() {
        const toggleFlexDrawer = document.getElementById('toggle-flex-mode');
        if (toggleFlexDrawer && window.ambientDevice) {
            toggleFlexDrawer.checked = window.ambientDevice.isFlexMode;
        }
    }

    openShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal-backdrop');
        if (modal) modal.classList.add('open');
        document.body.classList.remove('user-idle');
    }

    closeShortcutsModal() {
        const modal = document.getElementById('shortcuts-modal-backdrop');
        if (modal) modal.classList.remove('open');
    }

    openDrawer() {
        this.isDrawerOpen = true;
        const drawer = document.getElementById('settings-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (drawer) drawer.classList.add('open');
        if (backdrop) backdrop.classList.add('open');
        if (window.ambientDevice) {
            window.ambientDevice.updateProfileUI();
            this.syncFlexModeUI();
        }
        document.body.classList.remove('user-idle');
    }

    closeDrawer() {
        this.isDrawerOpen = false;
        const drawer = document.getElementById('settings-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        if (drawer) drawer.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
    }

    bindKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'd':
                    this.cycleDeviceProfile();
                    break;
                case 'x':
                    window.ambientDevice.toggleFlexMode();
                    this.syncFlexModeUI();
                    break;
                case 'p':
                    window.ambientLaptop.togglePomodoro();
                    break;
                case '?':
                    const modal = document.getElementById('shortcuts-modal-backdrop');
                    if (modal && modal.classList.contains('open')) this.closeShortcutsModal();
                    else this.openShortcutsModal();
                    break;
                case 'f':
                    this.toggleFullscreen();
                    break;
                case 'm':
                    const muted = window.ambientAudio.toggleMute();
                    this.updateSoundButtonUI(!muted && this.isSoundPlaying);
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleSound();
                    break;
                case 'arrowright':
                    if (this.mode === 'art') window.ambientArt.next();
                    break;
                case 'arrowleft':
                    if (this.mode === 'art') window.ambientArt.prev();
                    break;
                case 's':
                    if (this.isDrawerOpen) this.closeDrawer();
                    else this.openDrawer();
                    break;
                case 'escape':
                    this.closeShortcutsModal();
                    if (this.isDrawerOpen) this.closeDrawer();
                    break;
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        }
    }

    /**
     * TV Theater Mode: Auto-hide dock and cursor on idle
     */
    initAutoDimTimer() {
        const resetIdle = () => {
            document.body.classList.remove('user-idle');
            clearTimeout(this.idleTimeout);

            if (!this.isDrawerOpen) {
                this.idleTimeout = setTimeout(() => {
                    document.body.classList.add('user-idle');
                }, this.idleDelay);
            }
        };

        window.addEventListener('mousemove', resetIdle);
        window.addEventListener('mousedown', resetIdle);
        window.addEventListener('keydown', resetIdle);
        window.addEventListener('touchstart', resetIdle);

        resetIdle();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AmbientApp();
});
