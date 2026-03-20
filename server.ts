import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { generateGMPrompt } from './src/utils/prompts.js';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize firebase admin
initializeApp({
  projectId: 'senda-quest-1',
});

// Construct Vite-matching environment precedence
const isProdEnv = process.env.NODE_ENV === 'production';
const envPaths = isProdEnv
  ? ['.env.production.local', '.env.production', '.env.local', '.env']
  : ['.env.development.local', '.env.development', '.env.local', '.env'];

dotenv.config({ path: envPaths });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // API Route for Gemini GM Response
  app.post('/api/gm-response', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
      const idToken = authHeader.split('Bearer ')[1];
      await getAuth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }

    const { action, isRoll, gameState } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    let summaryText = "";
    if (gameState.logs && gameState.logs.length > 30) {
      const logsToSummarize = gameState.logs.slice(0, gameState.logs.length - 15)
        .map((l: any) => `${l.sender.toUpperCase()}: ${l.text}`).join('\n');

      try {
        const adminAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const summaryResponse = await adminAi.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Summarize the following D&D dark fantasy game logs concisely in a single paragraph, focusing on major events, defeated enemies, and current goals. Keep it under 100 words:\\n\\n${logsToSummarize}`
        });
        summaryText = summaryResponse.text || "";
      } catch (e) {
        console.error("Failed to generate summary", e);
      }
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: generateGMPrompt(action, isRoll, gameState, summaryText),
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      const status = error.message?.includes('429') ? 429 : 500;
      res.status(status).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  const isProd = process.env.NODE_ENV === 'production';
  
  if (!isProd) {
    console.log('Starting in DEVELOPMENT mode (Vite middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Starting in PRODUCTION mode (Static serving)');
    const distPath = path.join(__dirname, 'dist');
    
    // Check if dist exists to prevent crashes in production mode if build is missing
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
