export type ClassType = 'Warrior' | 'Ranger' | 'Wizard' | 'Cleric';
export type RaceType = 'Human' | 'Dwarf' | 'Elf';
export type BackstoryType = 'Rich' | 'Modest' | 'Poor';
export type TemperamentType = 'Stoic' | 'Hotheaded' | 'Jovial' | 'Calculating';
export type AlignmentType = 'Lawful Good' | 'Neutral Good' | 'Chaotic Good' | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral' | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil';
export type BackgroundType = 'Imperial Vanguard' | 'Seasoned Wayfarer' | 'Desperate Survivor';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'potion' | 'utility';
  effect?: string;
}

export interface Character {
  uid?: string;
  name: string;
  class: ClassType;
  race: RaceType;
  backstory: BackstoryType;
  temperament: TemperamentType;
  alignment: AlignmentType;
  background: BackgroundType;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  inventory: Item[];
  equippedWeapon?: Item;
  equippedArmor?: Item;
}

export interface Enemy {
  id: string;
  name: string;
  hp?: number;
  maxHp?: number;
}

export interface GameState {
  character: Character | null;
  currentView: 'landing' | 'creation' | 'quest' | 'inventory' | 'character' | 'resources';
  logs: GameLog[];
  isCombat: boolean;
  isGameOver?: boolean;
  combatCount: number;
  enemies: Enemy[];
  turn: 'player' | 'enemy';
}

export interface GameLog {
  id: string;
  sender: 'gm' | 'player' | 'system';
  text: string;
  timestamp: number;
  uid?: string;
}
