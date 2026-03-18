import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API Route for Gemini GM Response
  app.post('/api/gm-response', async (req, res) => {
    const { action, isRoll, gameState } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contextLogs = gameState.logs.slice(-15).map((l: any) => `${l.sender.toUpperCase()}: ${l.text}`).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a Game Master in a dark fantasy tavern setting. 
        Player Character: ${JSON.stringify(gameState.character)}
        Combat Status: ${gameState.isCombat ? 'ACTIVE' : 'INACTIVE'}
        Combat Encounter Count: ${gameState.combatCount}
        Narrative Length (Logs): ${gameState.logs.length}
        Recent History:
        ${contextLogs}
        
        ${isRoll ? 'The player just rolled a' : 'Player Action'}: ${action}
        
        Respond as the GM. Keep it atmospheric, dark, and concise. 
        
        CRITICAL: INITIATIVE FLOW
        - Initiative is rolled EXACTLY ONCE at the start of combat.
        - If the player just provided an initiative roll (e.g., "15 (Initiative)"), you MUST proceed to describe the start of the battle and the first round. 
        - NEVER ask for initiative if Combat Status is ACTIVE.
        - NEVER ask for initiative if the Recent History shows it has already been requested or rolled.
        
        Difficulty Scaling:
        - If Combat Encounter Count is 1 (First Encounter): Make the combat relatively easy. Enemies should have lower health and deal less damage. The player should feel powerful and capable.
        - As Combat Encounter Count increases: Gradually increase the difficulty. Enemies should become more numerous, have more HP, and use more complex tactics.
        - Narrative Length: Use the narrative length to gauge the depth of the story. Longer narratives should generally lead to more significant and challenging stakes.
        
        Rules for Combat:
        - When asking for a roll, ALWAYS specify what the roll is for (e.g., "Roll for Strength to force the door"). DO NOT reveal the specific consequences of high or low rolls in advance; the player should discover the outcome through your narrative after the roll. For initiative rolls, never reveal the stakes or potential consequences.
        - Cleric and Wizard spells are more powerful/heavily weighted than their physical attacks, as they have weaker primary weapons.
        - If Combat Status is INACTIVE and an encounter begins:
          1. Use [COMBAT_START] and [ROLL_D20] immediately.
          2. Tell the player to roll for initiative.
          3. DO NOT provide the full narrative context of the encounter until AFTER the initiative roll is received.
          4. List the initial enemies using the [ENEMIES: Name1, Name2] tag.
        
        - If Combat Status is ACTIVE:
          1. DO NOT use [COMBAT_START].
          2. DO NOT ask for initiative again. The initiative has already been rolled.
          3. Proceed with describing the results of actions and the flow of battle.
          4. If the player just rolled initiative, NOW describe the scene, the enemies' positions, and the start of the first round.
        
        General Rules:
        - When enemies are defeated or new ones appear, ALWAYS update the list using [ENEMIES: Name1, Name2].
        - If all enemies are defeated, use [COMBAT_END].
        - If the player targets a specific enemy (e.g., "targeting Goblin 1"), describe the outcome specifically for that target.
        
        Safety & Context Guarding:
        - If the player enters something inappropriate, offensive, or completely out of context (e.g., modern technology, breaking the 4th wall, or non-fantasy requests):
          1. Blunty inform them that such behavior is not permitted in this world.
          2. OR, deflect the request and guide them back to the narrative (e.g., "The shadows ignore your strange words; the goblin's blade is a far more pressing concern").
          3. Maintain the dark fantasy tone at all times.
        
        Custom Action Interpretation:
        - If the player describes a custom action (e.g., "I try to swing from the chandelier" or "I attempt to reason with the guard"):
          1. Interpret the action within the narrative.
          2. If a roll is required, use [ROLL_D20] and specify the attribute (e.g., "Roll for Dexterity to swing from the chandelier").
          3. Ensure the action is reasonable within the dark fantasy setting.
        
        Diplomacy & De-escalation:
        - If the player attempts to escape, talk their way out, or de-escalate AFTER you have prompted for initiative but BEFORE they have rolled it:
          1. Acknowledge the attempt.
          2. Prompt for a Charisma (Diplomacy) roll using [ROLL_D20].
          3. If the roll is successful: Describe the de-escalation and use [COMBAT_END].
          4. If the roll fails: Describe the failure (e.g., the enemy is too enraged) and EXPLICITLY state that this roll result will be used as their Initiative. Proceed with the combat narrative immediately using that roll value. DO NOT use [ROLL_D20] again and DO NOT ask for an initiative roll; the Diplomacy roll has already served that purpose.
        
        Hidden Tags:
        - [COMBAT_START] to enter combat mode
        - [COMBAT_END] to exit combat mode
        - [ROLL_D20] to prompt the player for a d20 roll
        - [ENEMIES: Name1, Name2] to define/update the current enemies in combat
        - [PLAYER_HP: value] to update the player's current health. YOU MUST USE THIS whenever the player takes damage or is healed. ALWAYS include the specific damage or healing numbers (e.g., "The blade bites deep for 6 damage") directly in your narrative response.
        - [PLAYER_MANA: value] to update the player's current mana. YOU MUST USE THIS whenever the player gains or loses mana.`,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      const status = error.message?.includes('429') ? 429 : 500;
      res.status(status).json({ error: error.message || 'Internal Server Error' });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const root = process.cwd();

  if (isProd) {
    console.log('Starting in PRODUCTION mode (Static serving)');
    const distPath = path.join(root, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('Starting in DEVELOPMENT mode (Vite middleware)');
    const vite = await createViteServer({
      root,
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
