/**
 * Ambient Web Display - Firebase Configuration & App Check Module
 * Modular Firebase v11+ with App Check, Auth, Firestore, Remote Config & Vertex AI
 */

// Default or User-Supplied Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDEMO-KEY-FOR-SAMSUNG-AMBIENT-AI",
    authDomain: "samsung-ambient-genai.firebaseapp.com",
    projectId: "samsung-ambient-genai",
    storageBucket: "samsung-ambient-genai.appspot.com",
    messagingSenderId: "102938475610",
    appId: "1:102938475610:web:abcdef1234567890",
    measurementId: "G-AMBIENTAI123"
};

/**
 * Loads custom Firebase config if saved by user in Settings, or falls back to template
 */
export function getFirebaseConfig() {
    try {
        const custom = localStorage.getItem('ambient_custom_firebase_config');
        if (custom) {
            return JSON.parse(custom);
        }
    } catch (e) {
        console.warn("Could not read custom Firebase config", e);
    }
    return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(configObj) {
    localStorage.setItem('ambient_custom_firebase_config', JSON.stringify(configObj));
}

export function isUsingDemoConfig() {
    const cfg = getFirebaseConfig();
    return !cfg.apiKey || cfg.apiKey.includes("DEMO-KEY");
}
