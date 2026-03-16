import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, ChevronDown, Shield, Zap, Target, Heart, Dices } from 'lucide-react';
import { Character, ClassType, RaceType, BackstoryType, TemperamentType, AlignmentType, BackgroundType } from '../types';
import { CLASSES, RACES, BACKGROUNDS } from '../constants';

interface CharacterCreationProps {
  onComplete: (character: Character) => void;
  key?: any;
}

export default function CharacterCreation({ onComplete }: CharacterCreationProps) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    class: 'Warrior',
    race: 'Human',
    backstory: 'Modest',
    temperament: 'Stoic',
    alignment: 'True Neutral',
    background: 'Seasoned Wayfarer',
    hp: 20,
    maxHp: 20,
    mana: 10,
    maxMana: 10,
    inventory: [],
  });

  const steps = [
    { title: 'Identity', fields: ['name'] },
    { title: 'Origins', fields: ['race', 'class'] },
    { title: 'History', fields: ['backstory', 'temperament', 'alignment'] },
    { title: 'Equipment', fields: ['background'] },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      const bg = BACKGROUNDS[formData.background as BackgroundType];
      const finalChar: Character = {
        ...formData as Character,
        inventory: [...bg.items],
        hp: 20,
        maxHp: 20,
        mana: 10,
        maxMana: 10,
      };
      onComplete(finalChar);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const generateRandomName = () => {
    const prefixes = ['Thal', 'Kael', 'Morg', 'Dra', 'Val', 'Zor', 'Grom', 'Eld', 'Syl', 'Bara'];
    const suffixes = ['dor', 'ith', 'gan', 'kar', 'ius', 'ryn', 'mash', 'wen', 'vane', 'thos'];
    const titles = ['the Shadow', 'of the Void', 'Ironfoot', 'Whisperwind', 'the Exile', 'Grimbane', 'Stormborn'];
    
    const first = prefixes[Math.floor(Math.random() * prefixes.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
    const title = Math.random() > 0.6 ? ` ${titles[Math.floor(Math.random() * titles.length)]}` : '';
    
    setFormData({ ...formData, name: first + title });
  };

  return (
    <div className="min-h-full p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#ff4e00]">
            {steps[step].title}
          </h2>
          <span className="text-xs font-sans font-bold text-[#8e9299] uppercase tracking-widest">
            Step {step + 1} of {steps.length}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Hero's Name</label>
                  <button 
                    onClick={generateRandomName}
                    className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-[#ff4e00] hover:text-white transition-colors"
                  >
                    <Dices size={14} /> Randomize
                  </button>
                </div>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your name..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#ff4e00] transition-colors font-serif text-xl"
                />
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Race</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(RACES) as RaceType[]).map(race => (
                      <SelectionCard 
                        key={race}
                        selected={formData.race === race}
                        onClick={() => setFormData({ ...formData, race })}
                        title={race}
                        subtitle={RACES[race].bonus}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Class</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(CLASSES) as ClassType[]).map(cls => (
                      <SelectionCard 
                        key={cls}
                        selected={formData.class === cls}
                        onClick={() => setFormData({ ...formData, class: cls })}
                        title={cls}
                        subtitle={CLASSES[cls].weapon}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Backstory</label>
                  <div className="relative">
                    <select 
                      value={formData.backstory}
                      onChange={(e) => setFormData({ ...formData, backstory: e.target.value as BackstoryType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#ff4e00] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Rich" className="bg-[#1a1a1a] text-white">Rich</option>
                      <option value="Modest" className="bg-[#1a1a1a] text-white">Modest</option>
                      <option value="Poor" className="bg-[#1a1a1a] text-white">Poor</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e9299] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Temperament</label>
                  <div className="relative">
                    <select 
                      value={formData.temperament}
                      onChange={(e) => setFormData({ ...formData, temperament: e.target.value as TemperamentType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#ff4e00] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Stoic" className="bg-[#1a1a1a] text-white">Stoic</option>
                      <option value="Hotheaded" className="bg-[#1a1a1a] text-white">Hotheaded</option>
                      <option value="Jovial" className="bg-[#1a1a1a] text-white">Jovial</option>
                      <option value="Calculating" className="bg-[#1a1a1a] text-white">Calculating</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e9299] pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Alignment</label>
                  <div className="relative">
                    <select 
                      value={formData.alignment}
                      onChange={(e) => setFormData({ ...formData, alignment: e.target.value as AlignmentType })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-white focus:outline-none focus:border-[#ff4e00] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Lawful Good" className="bg-[#1a1a1a] text-white">Lawful Good</option>
                      <option value="Neutral Good" className="bg-[#1a1a1a] text-white">Neutral Good</option>
                      <option value="Chaotic Good" className="bg-[#1a1a1a] text-white">Chaotic Good</option>
                      <option value="Lawful Neutral" className="bg-[#1a1a1a] text-white">Lawful Neutral</option>
                      <option value="True Neutral" className="bg-[#1a1a1a] text-white">True Neutral</option>
                      <option value="Chaotic Neutral" className="bg-[#1a1a1a] text-white">Chaotic Neutral</option>
                      <option value="Lawful Evil" className="bg-[#1a1a1a] text-white">Lawful Evil</option>
                      <option value="Neutral Evil" className="bg-[#1a1a1a] text-white">Neutral Evil</option>
                      <option value="Chaotic Evil" className="bg-[#1a1a1a] text-white">Chaotic Evil</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8e9299] pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <label className="block text-xs uppercase tracking-widest font-bold text-[#8e9299]">Starting Gear</label>
                <div className="grid grid-cols-1 gap-3">
                  {(Object.keys(BACKGROUNDS) as BackgroundType[]).map(bg => (
                    <SelectionCard 
                      key={bg}
                      selected={formData.background === bg}
                      onClick={() => setFormData({ ...formData, background: bg })}
                      title={bg}
                      subtitle={BACKGROUNDS[bg].description}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`flex items-center gap-2 text-sm uppercase tracking-widest font-bold transition-opacity ${step === 0 ? 'opacity-0' : 'opacity-50 hover:opacity-100'}`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          <button
            onClick={handleNext}
            disabled={step === 0 && !formData.name}
            className="flex items-center gap-2 px-8 py-3 bg-[#ff4e00] text-white rounded-full text-sm uppercase tracking-widest font-bold hover:bg-[#ff6a26] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === steps.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SelectionCard({ title, subtitle, selected, onClick }: { title: string, subtitle: string, selected: boolean, onClick: () => void, key?: any }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all duration-300 ${selected ? 'bg-[#ff4e00]/10 border-[#ff4e00] shadow-[0_0_15px_rgba(255,78,0,0.1)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
    >
      <h4 className={`font-bold ${selected ? 'text-white' : 'text-[#e0d8d0]'}`}>{title}</h4>
      <p className="text-xs text-[#8e9299] mt-1">{subtitle}</p>
    </button>
  );
}
