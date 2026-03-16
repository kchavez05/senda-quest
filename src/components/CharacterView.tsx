import React from 'react';
import { motion } from 'motion/react';
import { User, Shield, Zap, Target, Heart, Scroll } from 'lucide-react';
import { Character } from '../types';
import { CLASSES, RACES } from '../constants';

interface CharacterViewProps {
  character: Character | null;
  key?: any;
}

export default function CharacterView({ character }: CharacterViewProps) {
  if (!character) return null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <User size={32} className="text-[#ff4e00]" />
        <h2 className="text-3xl font-bold tracking-tight">Hero Profile</h2>
      </div>

      <div className="space-y-6">
        {/* Header Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Scroll size={120} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-4xl font-bold text-white mb-2">{character.name}</h3>
            <div className="flex gap-3 text-xs uppercase tracking-widest font-bold">
              <span className="text-[#ff4e00]">{character.race}</span>
              <span className="text-[#8e9299]">•</span>
              <span className="text-[#ff4e00]">{character.class}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={<Heart size={16} />} label="Health" value={`${character.hp} / ${character.maxHp}`} color="text-red-500" />
          <StatCard icon={<Zap size={16} />} label="Mana" value={`${character.mana} / ${character.maxMana}`} color="text-blue-500" />
          <StatCard icon={<Shield size={16} />} label="Defense" value="12" color="text-slate-400" />
          <StatCard icon={<Target size={16} />} label="Initiative" value="+2" color="text-emerald-400" />
        </div>

        {/* Details Section */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <DetailRow label="Alignment" value={character.alignment} />
          <DetailRow label="Temperament" value={character.temperament} />
          <DetailRow label="Backstory" value={character.backstory} />
          <DetailRow label="Background" value={character.background} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className={color}>{icon}</span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#8e9299]">{label}</span>
      </div>
      <span className="text-xl font-bold text-white">{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <span className="text-xs uppercase tracking-widest font-bold text-[#8e9299]">{label}</span>
      <span className="text-white font-serif italic">{value}</span>
    </div>
  );
}
