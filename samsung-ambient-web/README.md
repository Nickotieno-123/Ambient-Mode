# Samsung Ambient Display for Web — Gen AI & Firebase Edition

A next-generation ambient smart display web application powered by **Firebase AI Logic (Vertex AI with Gemini 1.5/2.0 Flash)**, **Cloud Firestore**, **Authentication**, **Remote Config**, and **App Check**.

Designed to turn any screen — **Phones, Foldables, Tablets, Laptops, or Smart TVs** — into an intelligent, contextual ambient artwork and productivity display.

---

## 🔥 Firebase & Gen AI Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Ambient Display Web App                         │
└───────┬─────────────────┬──────────────────┬───────────────────┬───────┘
        │                 │                  │                   │
        ▼                 ▼                  ▼                   ▼
┌───────────────┐ ┌───────────────┐  ┌───────────────┐  ┌────────────────┐
│ Firebase Auth │ │Cloud Firestore│  │ Remote Config │  │ Firebase AI    │
│  - Anonymous  │ │ - Cross-device│  │ - Gemini Model│  │ Logic (Vertex) │
│  - Google Pop │ │   sync        │  │   parameters  │  │ - Gemini 1.5   │
│  - Account    │ │ - AI Artworks │  │ - Daily wisdom│  │   Flash        │
│    linking    │ │ - Preferences │  │   intervals   │  │ - AI Art & Zen │
└───────┬───────┘ └───────┬───────┘  └───────┬───────┘  └────────┬───────┘
        │                 │                  │                   │
        └─────────────────┴────────┬─────────┴───────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │       Firebase App Check      │
                   │ (reCAPTCHA Enterprise / Debug)│
                   └───────────────────────────────┘
```

---

### ✨ Gen AI Features (Firebase AI Logic / Vertex AI)

#### 1. 🎨 Ambient Gen AI Art Studio ("Ambient Muse")
- Prompt Gemini with your vision (e.g. *"Misty Nordic sunrise with minimal pine silhouettes"*, *"Cyberpunk neon rain in Kyoto"*, *"Warm terracotta minimalist ceramics"*).
- Choose aesthetic moods: **Ethereal Aurora**, **Minimalist Geometry**, **Zen Ink Wash**, or **Warm Terracotta**.
- Gemini synthesizes the palette, artistic title, artist persona, era, description, and an intricate vector composition rendered live inside **The Frame TV** with realistic matting and Ken Burns drift.
- Automatically saves generated pieces to your **Cloud Firestore** collection.

#### 2. 🧘 Contextual AI Zen Wisdom
- Instead of static lists, Gemini generates single-sentence, profound, minimalist reflections in real time based on your actual local weather, temperature, and time of day (*"In the rainy morning air, stillness reveals what motion hides"*).

#### 3. 🏠 AI Room & Wall Color Stylist
- Analyzes your wall color or sampled room photo and prescribes the harmonious ambient lighting tone, accent highlights, and matching nature soundscape.

---

### 🛡️ Supported Firebase Products

| Product | Role in Ambient Display |
|---|---|
| **Firebase AI Logic (Vertex AI)** | Powers Gemini 1.5/2.0 Flash for on-demand generative artwork and contextual daily wisdom. |
| **Cloud Firestore** | Real-time cross-device sync: change a scene on your phone, and your TV or laptop updates instantly via `onSnapshot`. Stores personal AI art galleries and ambient preferences. |
| **Firebase Authentication** | Frictionless **Anonymous Sign-In** by default (essential for smart TVs and bedside stands without keyboards) + **Google Sign-In** for cross-device cloud persistence. |
| **Firebase Remote Config** | Controls AI model flags (`ai_model_name`), wisdom generation frequency, and seasonal theme overrides on the fly. |
| **Firebase App Check** | Protects Firestore and Vertex AI API calls against abuse, bots, and unverified origins using reCAPTCHA Enterprise or debug tokens. |

---

## 📱 Multi-Device Support

Works across all device formats with automatic detection or manual toggle (<kbd>D</kbd>):

```
[ ✨ Auto-Detect ]  [ 📱 Phone ]  [ 📐 Foldable ]  [ 📟 Tablet ]  [ 💻 Laptop ]  [ 📺 TV ]
```

- **📐 Foldables (Galaxy Z Fold, Z Flip, Pixel Fold, Xiaomi Mix Fold, Surface Duo)**:
  - **Flex Mode Tabletop (~90° Fold)**: Bending your phone transforms the top screen into an ambient visual display and the bottom flat screen into an **Ambient Touch Control Deck** with Pomodoro timer, soundboard, and night dimmer.
  - Built-in support for W3C **Device Posture API** and CSS Viewport Segments API.
- **📱 Mobile Phones**: iPhone/Android portrait and horizontal StandBy nightstand mode with Screen Wake Lock.
- **📟 Tablets & iPads**: High-DPI Retina canvas scaling with finger-friendly touch targets.
- **💻 Laptops & PCs**: Dual-pane dashboard with Pomodoro timer, task scratchpad, and battery monitor.
- **📺 Smart TVs**: 10-foot UI, D-Pad remote navigation, and OLED burn-in drift protection.

---

## ⌨️ Shortcuts & Gestures

| Shortcut / Gesture | Action |
|---|---|
| <kbd>D</kbd> | **Cycle Device Profile (Phone / Foldable / Tablet / Laptop / TV)** |
| <kbd>X</kbd> | **Toggle Foldable Flex Mode Tabletop Stand** |
| <kbd>P</kbd> | **Start / Pause Focus (Pomodoro Timer)** |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>Space</kbd> | Play / Pause Soundscape |
| <kbd>M</kbd> | Mute / Unmute Audio |
| <kbd>S</kbd> | Open / Close Settings Drawer |
| <kbd>?</kbd> | Open Shortcuts & Gestures Guide |
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / Next Artwork (Art Mode) |
| 👆 **Double-Tap Screen** | Toggle Fullscreen |
| 👉 **Swipe Left / Right** | Next / Previous Scene or Artwork |
| 👇 **Swipe Down / Up** | Open / Close Settings Drawer |

---

## 🚀 How to Run & Connect Firebase

1. Open `index.html` directly in your browser:
   ```
   file:///C:/Users/Nicholas/.gemini/antigravity/scratch/samsung-ambient-web/index.html
   ```
2. **Out of the box**: Runs in **Smart Demo Mode** with simulated Gemini AI generation and local cloud persistence so you can test all features immediately.
3. **To link your live Firebase Project**:
   - Open Settings (<kbd>S</kbd>) ➔ navigate to the **🔥 Firebase & AI** tab.
   - Paste your project's `firebaseConfig` JSON object from the [Firebase Console](https://console.firebase.google.com).
   - Click **Save & Reload Firebase** to activate live Gemini AI Logic, real-time Firestore sync, and Google Authentication!
