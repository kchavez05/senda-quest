<div align="center">

# 🗡️ SENDA QUEST

**An AI-Powered Modular Web RPG**

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-v12-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg)](https://tailwindcss.com/)

</div>

---

## 📖 About The Game

**Senda Quest** is an immersive, AI-driven tabletop RPG experience directly in your browser. Powered by Gemini AI acting as your dynamic Game Master, players can forge their own destinies in vibrant worlds, battle intelligent adversaries, and manage deep inventories—all visualized through a sleek, modern, terminal-inspired interface.

Whether you prefer the neon-drenched streets of a **Cyberpunk** dystopia, the echoing void of **Cosmic Horror**, or a classic **Dark Fantasy** tavern, Senda Quest adapts the narrative atmosphere in real-time to your chosen theme.

## ✨ Features

- **🧠 Dynamic AI Game Master**: The environment, enemies, and narrative react entirely to your choices, propelled by Google's powerful Gemini LLMs.
- **🎨 Themed Adventures**: Select your world atmosphere at character creation—the Game Master seamlessly generates bespoke environments matching your specific genre.
- **💾 Persistent Save States**: Create multiple heroes within different storylines and environments. Your campaigns, stats, and inventories are saved in Firebase Firestore, allowing you to resume your journey anytime.
- **⚔️ Interactive Character Systems**: Class-based character creation, real-time HP/Level tracking, and fluid inventory management hooks.
- **🎲 Immersive Flow**: Roll for initiative, make narrative-changing choices, and survive custom encounters with beautiful iconography and dynamic mount animations.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Motion (Animations)
- **State Management**: Zustand
- **Backend / DB**: Firebase App & Firestore (Real-time DB), Firebase Authentication
- **AI Integration**: `@google/genai` (Gemini API)
- **Mobile Platform**: Capacitor (Android native porting) & PWA (vite-plugin-pwa)
- **Testing**: Vitest, React Testing Library, Playwright (E2E)

---

## 🚀 Run Locally

**Prerequisites:** Node.js (v18+)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   You will need to pass your Google Gemini API key to the Game Master engine.
   Create a `.env.local` inside the root directory and add:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to start your adventure.

4. **Run Native Android Build:**
   SendaQuest is built to run natively on mobile devices. To sync the web code and open the project in Android Studio:
   ```bash
   npm run build
   npx cap copy
   npx cap open android
   ```

---

## 🤝 Contributing

We strictly enforce branch policies before adding new features to the realm of Senda Quest:

1. **Development**: Never commit immediately to `main`. Check out the `develop` branch for any new features or bug fixes.
2. **Testing**: Run `npm run test:unit` for core component logic and `npm run test:e2e` for visual browser tests. 
3. **Documentation**: Any functional change to the app *must* be accompanied by an update to this `README.md` to reflect the new state. 
4. **Releasing**: When merging from `develop` to `main`, an AI assistant (or human) must draft and commit release notes directly to `CHANGELOG.md` representing the version push.

---
*The dice are cast in the shadows of the hearth. Your destiny awaits among the smoke and steel.*
