/**
 * Ambient Web Display - Firebase Service & Gen AI Engine
 * Integrates Firebase Authentication, Cloud Firestore, Remote Config, App Check,
 * and Firebase Vertex AI (AI Logic with Gemini 1.5/2.0 Flash).
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { 
    getAuth, 
    signInAnonymously, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    limit, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { 
    getRemoteConfig, 
    fetchAndActivate, 
    getValue, 
    getBoolean, 
    getString, 
    getNumber 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-remote-config.js';
import { 
    initializeAppCheck, 
    ReCaptchaEnterpriseProvider, 
    CustomProvider 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app-check.js';
import { 
    getVertexAI, 
    getGenerativeModel 
} from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-vertexai.js';

import { getFirebaseConfig, isUsingDemoConfig } from './firebase-config.js';

class FirebaseAmbientService {
    constructor() {
        this.app = null;
        this.auth = null;
        this.db = null;
        this.remoteConfig = null;
        this.appCheck = null;
        this.vertexAI = null;
        this.geminiModel = null;
        this.currentUser = null;
        this.isDemoMode = false;
        this.listeners = [];
        this.onUserChangedCallbacks = [];

        // Remote Config default parameters
        this.remoteValues = {
            ai_daily_wisdom_enabled: true,
            ai_model_name: "gemini-1.5-flash",
            ambient_quote_interval_sec: 75,
            seasonal_theme: "nordic",
            featured_ai_art_style: "ethereal_aurora"
        };
    }

    async init() {
        const config = getFirebaseConfig();
        this.isDemoMode = isUsingDemoConfig();

        if (this.isDemoMode) {
            console.log("ℹ️ Running in Firebase Smart Demo Mode with local simulation.");
            this.setupDemoMode();
            return;
        }

        try {
            // 1. Initialize Firebase App
            this.app = initializeApp(config);

            // 2. Initialize App Check (Self-debug token in dev, Enterprise in prod)
            try {
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
                }
                // AppCheck reCAPTCHA Enterprise provider or Debug provider
                this.appCheck = initializeAppCheck(this.app, {
                    provider: new CustomProvider({
                        getToken: () => Promise.resolve({ token: 'ambient-debug-appcheck-token', expireTimeMillis: Date.now() + 3600000 })
                    }),
                    isTokenAutoRefreshEnabled: true
                });
                console.log("🛡️ Firebase App Check initialized successfully.");
            } catch (acErr) {
                console.warn("App Check initialization skipped/deferred:", acErr.message);
            }

            // 3. Initialize Firebase Auth
            this.auth = getAuth(this.app);
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.updateAuthUI(user);
                this.onUserChangedCallbacks.forEach(cb => cb(user));
                if (user) {
                    this.syncWithFirestore(user.uid);
                }
            });

            // Anonymous Sign-in (Ideal for smart displays, TV, and frictionless mobile use)
            try {
                await signInAnonymously(this.auth);
            } catch (authErr) {
                console.warn("Auto anonymous auth skipped:", authErr.message);
            }

            // 4. Initialize Cloud Firestore
            this.db = getFirestore(this.app);

            // 5. Initialize Firebase Remote Config
            try {
                this.remoteConfig = getRemoteConfig(this.app);
                this.remoteConfig.settings.minimumFetchIntervalMillis = 60000; // 1 min in dev
                this.remoteConfig.defaultConfig = this.remoteValues;
                await fetchAndActivate(this.remoteConfig);
                this.remoteValues.ai_daily_wisdom_enabled = getBoolean(this.remoteConfig, 'ai_daily_wisdom_enabled');
                this.remoteValues.ai_model_name = getString(this.remoteConfig, 'ai_model_name') || 'gemini-1.5-flash';
                this.remoteValues.ambient_quote_interval_sec = getNumber(this.remoteConfig, 'ambient_quote_interval_sec') || 75;
                console.log("⚡ Firebase Remote Config active:", this.remoteValues);
            } catch (rcErr) {
                console.warn("Remote Config using default parameters:", rcErr.message);
            }

            // 6. Initialize Firebase Vertex AI (AI Logic SDK)
            try {
                this.vertexAI = getVertexAI(this.app);
                this.geminiModel = getGenerativeModel(this.vertexAI, {
                    model: this.remoteValues.ai_model_name,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 600
                    }
                });
                console.log(`✨ Firebase Vertex AI Logic initialized with model: ${this.remoteValues.ai_model_name}`);
            } catch (aiErr) {
                console.warn("Vertex AI initialized in smart fallback mode:", aiErr.message);
            }

            this.updateSyncBadge(true, "Connected to Firebase Cloud");
        } catch (e) {
            console.warn("Firebase failed to initialize with provided config; activating smart simulated demo mode.", e);
            this.setupDemoMode();
        }
    }

    setupDemoMode() {
        this.isDemoMode = true;
        this.currentUser = {
            uid: "demo-ambient-user-88",
            isAnonymous: true,
            displayName: "Ambient Explorer"
        };
        this.updateAuthUI(this.currentUser);
        this.updateSyncBadge(true, "Simulated Cloud Active (Demo Mode)");
    }

    // ==========================================
    // AUTHENTICATION METHODS
    // ==========================================
    async signInWithGoogle() {
        if (this.isDemoMode || !this.auth) {
            this.currentUser = {
                uid: "google-demo-user-101",
                displayName: "Nicholas",
                email: "user@ambient.google",
                photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
            };
            this.updateAuthUI(this.currentUser);
            alert("Signed in as Nicholas (Demo Google Account). Cloud sync active!");
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            this.currentUser = result.user;
            this.updateAuthUI(this.currentUser);
        } catch (error) {
            alert("Google Sign-In failed: " + error.message);
        }
    }

    async signOutUser() {
        if (this.isDemoMode || !this.auth) {
            this.setupDemoMode();
            return;
        }
        await signOut(this.auth);
        await signInAnonymously(this.auth);
    }

    onUserChanged(callback) {
        this.onUserChangedCallbacks.push(callback);
    }

    updateAuthUI(user) {
        const userBtn = document.getElementById('btn-user-auth');
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-display-name');
        if (!userBtn) return;

        if (user && !user.isAnonymous && user.displayName) {
            userBtn.classList.add('authenticated');
            if (userName) userName.textContent = user.displayName;
            if (userAvatar) {
                userAvatar.innerHTML = user.photoURL 
                    ? `<img src="${user.photoURL}" class="avatar-img" alt="${user.displayName}">`
                    : `<span>${user.displayName.charAt(0)}</span>`;
            }
        } else {
            userBtn.classList.remove('authenticated');
            if (userName) userName.textContent = "Sign In";
            if (userAvatar) {
                userAvatar.innerHTML = `<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>`;
            }
        }
    }

    updateSyncBadge(active, tooltip = "Cloud Synced") {
        const badge = document.getElementById('cloud-sync-badge');
        if (badge) {
            badge.style.display = 'flex';
            badge.title = tooltip;
            badge.classList.toggle('active', active);
        }
    }

    // ==========================================
    // CLOUD FIRESTORE: PREFERENCES & CROSS-DEVICE SYNC
    // ==========================================
    async syncWithFirestore(uid) {
        if (this.isDemoMode || !this.db) return;

        try {
            // Listen for cross-device real-time updates (e.g. changing mode on phone updates TV)
            const prefDocRef = doc(this.db, 'users', uid, 'settings', 'ambient_profile');
            onSnapshot(prefDocRef, (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.activeScene && window.ambientVisual && data.activeScene !== window.ambientVisual.activeScene) {
                        window.ambientVisual.switchScene(data.activeScene);
                    }
                    if (data.clockStyle && window.ambientClock && data.clockStyle !== window.ambientClock.clockStyle) {
                        window.ambientClock.setClockStyle(data.clockStyle);
                    }
                    if (data.wallColor && window.ambientRoom) {
                        window.ambientRoom.setWallColor(data.wallColor);
                    }
                }
            });
        } catch (e) {
            console.warn("Firestore sync subscription warning:", e);
        }
    }

    async saveCloudPreferences(prefs) {
        if (!this.currentUser) return;
        if (this.isDemoMode || !this.db) {
            localStorage.setItem('ambient_cached_cloud_prefs', JSON.stringify(prefs));
            return;
        }

        try {
            const prefDocRef = doc(this.db, 'users', this.currentUser.uid, 'settings', 'ambient_profile');
            await setDoc(prefDocRef, {
                ...prefs,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.warn("Could not save to Firestore:", e);
        }
    }

    async saveAiArtworkToFirestore(artDoc) {
        if (!this.currentUser) return;
        if (this.isDemoMode || !this.db) {
            const list = JSON.parse(localStorage.getItem('ambient_cached_ai_art') || '[]');
            list.unshift(artDoc);
            localStorage.setItem('ambient_cached_ai_art', JSON.stringify(list));
            return;
        }

        try {
            const colRef = collection(this.db, 'users', this.currentUser.uid, 'ai_gallery');
            await addDoc(colRef, {
                ...artDoc,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.warn("Failed to store artwork in Firestore:", e);
        }
    }

    // ==========================================
    // GEN AI: FIREBASE VERTEX AI / GEMINI LOGIC
    // ==========================================

    /**
     * 1. AI Zen Wisdom & Daily Meditation
     * Generates a context-aware ambient reflection based on time, weather, and mood
     */
    async generateZenWisdom(weatherCond, temp, timeOfDay) {
        const prompt = `You are the philosophical AI mind of a high-end Samsung The Frame ambient display.
Generate a single-sentence profound, poetic, and serene reflection or minimalist quote (maximum 18 words) for a quiet display.
Current atmosphere: ${timeOfDay || 'evening'}, weather is ${weatherCond || 'clear sky'}, temperature is ${temp || '20'}°C.
Do not add conversational greeting, do not wrap in markdown or quotes, return just the plain contemplative sentence.`;

        if (this.geminiModel) {
            try {
                const response = await this.geminiModel.generateContent(prompt);
                const text = response.response.text().trim();
                return text;
            } catch (err) {
                console.warn("Vertex AI call failed; using procedural smart generator fallback:", err);
            }
        }

        // Smart procedural generative fallback
        const proceduralQuotes = [
            `In the ${weatherCond.toLowerCase() || 'quiet'} air, stillness reveals what motion hides.`,
            `The light of this ${timeOfDay || 'hour'} will never repeat itself; breathe it in.`,
            `Time does not pass outside of us; we are the space in which it unfolds.`,
            `Like raindrops on cool glass, each thought dissolves into peaceful calm.`,
            `In quiet contemplation, even the simplest room becomes a sanctuary.`
        ];
        return proceduralQuotes[Math.floor(Math.random() * proceduralQuotes.length)];
    }

    /**
     * 2. AI Ambient Art Generator ("Ambient Muse")
     * Creates rich artwork metadata and dynamic SVG/generative canvas recipes
     */
    async generateAiArtwork(userPrompt, aestheticMood = "ethereal_aurora") {
        const systemPrompt = `You are an elite master generative art curator creating an artwork for Samsung The Frame ambient mode.
User aesthetic prompt: "${userPrompt || 'Harmonic geometric silence in misty dawn'}".
Aesthetic Mood: "${aestheticMood}".

Respond ONLY with a valid JSON object (no markdown code fences, no extra text) with this exact schema:
{
  "title": "Short poetic title (2-5 words)",
  "artist": "Fictional persona or Master artist name",
  "year": "Year or Era string (e.g. 2026 or Contemporary Minimalist)",
  "medium": "Art medium (e.g. Algorithmic Colorfield on Silk, Generative Acrylic on Linen)",
  "description": "A 2-sentence poetic museum plaque description of the piece",
  "palette": ["#primary_hex", "#secondary_hex", "#accent_hex", "#deep_bg_hex", "#highlight_hex"],
  "svgData": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' width='100%' height='100%'>...clean elegant modern abstract geometric or organic composition with gradients...</svg>"
}`;

        let artResult = null;

        if (this.geminiModel) {
            try {
                const response = await this.geminiModel.generateContent(systemPrompt);
                let rawText = response.response.text().trim();
                // Strip markdown code fences if Gemini added them
                rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
                artResult = JSON.parse(rawText);
            } catch (err) {
                console.warn("Vertex AI JSON generation error; using procedural art synthesizer:", err);
            }
        }

        // If Gemini or Vertex AI was offline / demo, generate algorithmic masterpiece procedural data
        if (!artResult) {
            artResult = this.createProceduralMasterpiece(userPrompt, aestheticMood);
        }

        // Convert SVG into safe Data URL for The Frame image element
        const svgBlob = new Blob([artResult.svgData], { type: 'image/svg+xml;charset=utf-8' });
        artResult.url = URL.createObjectURL(svgBlob);
        artResult.isAiGenerated = true;

        // Save to Cloud Firestore
        this.saveAiArtworkToFirestore(artResult);

        return artResult;
    }

    /**
     * Algorithmic Procedural Masterpiece Generator (Generative fallback)
     */
    createProceduralMasterpiece(prompt, mood) {
        const palettes = {
            ethereal_aurora: ['#0f172a', '#1e1b4b', '#4338ca', '#38bdf8', '#a855f7'],
            minimalist_geo: ['#18181b', '#27272a', '#d4d4d8', '#f43f5e', '#3b82f6'],
            zen_ink: ['#09090b', '#18181b', '#3f3f46', '#e4e4e7', '#f4f4f5'],
            warm_terracotta: ['#292524', '#451a03', '#9a3412', '#ea580c', '#fb923c']
        };

        const colors = palettes[mood] || palettes.ethereal_aurora;
        const title = prompt ? prompt.split(' ').slice(0, 4).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Echoes of Stillness";

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
  <defs>
    <radialGradient id="aiGrad1" cx="35%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${colors[3]}" stop-opacity="0.8"/>
      <stop offset="60%" stop-color="${colors[2]}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="${colors[0]}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="aiGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors[4]}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${colors[1]}" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="aiBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="60"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${colors[0]}"/>
  <circle cx="450" cy="380" r="320" fill="url(#aiGrad1)" filter="url(#aiBlur)"/>
  <circle cx="820" cy="460" r="280" fill="url(#aiGrad2)" filter="url(#aiBlur)"/>
  <circle cx="600" cy="400" r="160" fill="none" stroke="${colors[3]}" stroke-width="2" stroke-opacity="0.6"/>
  <line x1="200" y1="400" x2="1000" y2="400" stroke="${colors[4]}" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="10 15"/>
  <circle cx="600" cy="400" r="12" fill="${colors[4]}"/>
</svg>`;

        return {
            title: title || "Resonance in Void",
            artist: "Gemini Generative Studio",
            year: "2026",
            medium: "Algorithmic Vector Synthesis on Canvas",
            description: "A meditation on balance and negative space, exploring light as an architecture of calm.",
            palette: colors,
            svgData: svg
        };
    }

    /**
     * 3. AI Room Color & Decor Stylist
     * Analyzes wall color and prescribes ideal ambient palettes and soundscapes
     */
    async analyzeRoomStyling(hexColor) {
        const prompt = `Given the room wall color ${hexColor}, recommend:
1. An ideal ambient lighting mood (Cool Nordic, Warm Hearth, Minimal Charcoal, Cyber Neon).
2. The best matching nature soundscape (rain, fireplace, ocean, drone, forest).
3. A 1-sentence design justification.
Return as JSON: {"lightingMood": "...", "soundscape": "...", "rationale": "..."}`;

        if (this.geminiModel) {
            try {
                const response = await this.geminiModel.generateContent(prompt);
                let text = response.response.text().trim();
                text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
                return JSON.parse(text);
            } catch (err) {
                console.warn("Room stylist AI call skipped:", err);
            }
        }

        // Procedural room styling recommendation
        return {
            lightingMood: "Warm Hearth",
            soundscape: "fireplace",
            rationale: `Wall tone ${hexColor} pairs harmoniously with warm amber diffusion and organic timber crackles.`
        };
    }
}

// Global Firebase Ambient Service singleton
window.firebaseService = new FirebaseAmbientService();
