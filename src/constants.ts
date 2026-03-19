import { ClassType, RaceType, BackgroundType, Item } from './types';

export const CLASSES: Record<ClassType, { weapon: string; description: string }> = {
  Warrior: { weapon: 'Sword & Shield', description: 'Melee combat specialist with high defense.' },
  Ranger: { weapon: 'Bow & Arrow', description: 'Ranged combat specialist with high dexterity.' },
  Wizard: { weapon: 'Two-handed Staff', description: 'Magic combat specialist with powerful spells.' },
  Cleric: { weapon: 'Mace & Shield', description: 'Healer and divine combatant.' },
};

export const RACES: Record<RaceType, { bonus: string; description: string }> = {
  Human: { bonus: '+ Intelligence', description: 'Versatile and ambitious.' },
  Dwarf: { bonus: '+ Strength', description: 'Sturdy and resilient.' },
  Elf: { bonus: '+ Dexterity', description: 'Agile and wise.' },
};

export const BACKGROUNDS: Record<BackgroundType, { items: Item[]; description: string }> = {
  'Imperial Vanguard': {
    description: 'A soldier of the empire, well-equipped and disciplined.',
    items: [
      { id: 'hp-1', name: 'Health Potion', description: 'Heals 2d4 HP', type: 'potion' },
      { id: 'hp-2', name: 'Health Potion', description: 'Heals 2d4 HP', type: 'potion' },
      { id: 'mp-1', name: 'Mana Potion', description: 'Restores 10 Mana', type: 'potion' },
      { id: 'mp-2', name: 'Mana Potion', description: 'Restores 10 Mana', type: 'potion' },
      { id: 'rope-1', name: 'Rope', description: '50ft of hempen rope', type: 'utility' },
      { id: 'rations-1', name: 'Rations', description: 'Dried meat and hardtack', type: 'utility' },
    ],
  },
  'Seasoned Wayfarer': {
    description: 'A traveler who has seen much of the world.',
    items: [
      { id: 'hp-3', name: 'Health Potion', description: 'Heals 2d4 HP', type: 'potion' },
      { id: 'mp-3', name: 'Mana Potion', description: 'Restores 10 Mana', type: 'potion' },
      { id: 'rations-2', name: 'Rations', description: 'Dried meat and hardtack', type: 'utility' },
    ],
  },
  'Desperate Survivor': {
    description: 'One who has lost everything but their life.',
    items: [],
  },
};

export const SPELLS: Record<ClassType, { name: string; cost: number; effect: string }[]> = {
  Warrior: [
    { name: 'Concentrate', cost: 5, effect: 'Next two attacks are guaranteed to hit' },
    { name: 'Berzerk', cost: 10, effect: 'Attack twice for next two rounds' },
    { name: 'Rage', cost: 8, effect: '+2 to Attack rolls for 3 rounds' },
  ],
  Wizard: [
    { name: 'Fireball', cost: 15, effect: 'Deal damage to all attackers' },
    { name: 'Frost Bolt', cost: 10, effect: 'Deal light damage, freezes target - cannot attack next round' },
    { name: 'Magic Missile', cost: 5, effect: 'Deal damage to target' },
  ],
  Ranger: [
    { name: 'Concentrate', cost: 5, effect: 'Next two attacks are guaranteed to hit' },
    { name: 'Entangle', cost: 10, effect: 'Target cannot attack for two rounds' },
    { name: 'Stealth', cost: 12, effect: 'Disappear for two rounds - cannot be hit' },
  ],
  Cleric: [
    { name: 'Heal', cost: 8, effect: 'Heals target for 2d4' },
    { name: 'Drain Life', cost: 12, effect: 'Drains target for 1d8' },
    { name: 'Divine Hammer', cost: 15, effect: 'A hammer descends from the heavens to deal 2d6 damage' },
  ],
};

// Game Master Tags
export const TAG_COMBAT_START = '[COMBAT_START]';
export const TAG_COMBAT_END = '[COMBAT_END]';
export const TAG_ROLL_D20 = '[ROLL_D20]';
export const TAG_ENEMIES_PREFIX = '[ENEMIES: ';
export const TAG_PLAYER_HP_PREFIX = '[PLAYER_HP: ';
export const TAG_PLAYER_MANA_PREFIX = '[PLAYER_MANA: ';
