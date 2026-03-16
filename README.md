<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Senda Quest

A dark fantasy RPG adventure where every path leads deeper into the abyss. Experience AI-driven storytelling, high-stakes dice rolling, and immersive character creation. Powered by Google Gemini AI.

## Features
- AI Game Master: Dynamic narrative and combat powered by Gemini AI
- Character Creation: Choose class, race, backstory, temperament, alignment, and gear
- Dice-Based Gameplay: D20 rolls for actions, combat, and skill checks
- Inventory & Spells: Manage items, cast spells, and use unique abilities
- Atmospheric UI: Modern, responsive interface with TailwindCSS and Lucide icons
- Persistent Logs: Track your journey and decisions

## Tech Stack
- React (TypeScript)
- Vite
- TailwindCSS
- Express (Node.js)
- Google Gemini AI (via @google/genai)

## Gameplay
1. Start your adventure and create a unique character
2. Interact with the AI Game Master via chat and actions
3. Roll dice for combat, skill checks, and narrative events
4. Manage inventory, cast spells, and make choices that shape your story
5. Survive encounters and explore the tavern's mysteries

## Setup & Local Development

**Prerequisites:** Node.js 18+ and a Gemini API key

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure your Gemini API key:
   - Copy `.env.example` to `.env.local`
   - Set `GEMINI_API_KEY` in `.env.local`
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment
- Build for production:
  ```bash
  npm run build
  ```
- Start in production mode:
  ```bash
  npm start
  ```

## Docker
Build and run with Docker:
```bash
# Build the image
docker build -t senda-quest .
# Run the container
# Set GEMINI_API_KEY as an environment variable
# Expose port 3000

docker run -e GEMINI_API_KEY=your_key -p 3000:3000 senda-quest
```

## Environment Variables
- `GEMINI_API_KEY`: Required for Gemini AI API calls
- `APP_URL`: Optional, for deployment URL

## Credits
- [Google Gemini AI](https://ai.google.dev/)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)

---

> View your app in AI Studio: https://ai.studio/apps/e3f91757-7d4a-4aa7-8afc-97bb875f15fe
