import React from 'react';
import { motion } from 'motion/react';
import { Settings, Home, HelpCircle, LogOut, MessageSquare, ChevronRight } from 'lucide-react';
import { GameState } from '../types';
import { logout } from '../firebase';

interface ResourcesViewProps {
  setView: (view: GameState['currentView']) => void;
  key?: any;
}

export default function ResourcesView({ setView }: ResourcesViewProps) {
  const handleLogout = async () => {
    await logout();
    setView('landing');
  };
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Settings size={32} className="text-[#ff4e00]" />
        <h2 className="text-3xl font-bold tracking-tight">Resources</h2>
      </div>

      <div className="space-y-3">
        <MenuButton 
          icon={<Home size={20} />} 
          label="Return to Home" 
          onClick={() => setView('landing')} 
        />
        <MenuButton 
          icon={<HelpCircle size={20} />} 
          label="How to Play" 
          onClick={() => {}} 
        />
        <MenuButton 
          icon={<LogOut size={20} />} 
          label="Sign Out" 
          onClick={handleLogout} 
        />
        <MenuButton 
          icon={<MessageSquare size={20} />} 
          label="Provide Feedback" 
          onClick={() => {}} 
        />
      </div>

      <div className="mt-12 p-8 bg-[#ff4e00]/5 border border-[#ff4e00]/10 rounded-3xl">
        <h4 className="text-[#ff4e00] font-bold uppercase tracking-widest text-xs mb-4">The Tavern's Code</h4>
        <p className="text-[#8e9299] text-sm leading-relaxed italic">
          "In this realm, your choices carry weight. The dice are but tools; your spirit is the true master of fate. Respect the GM, cherish your gear, and never trust a smiling goblin."
        </p>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
    >
      <div className="flex items-center gap-4">
        <span className="text-[#8e9299] group-hover:text-[#ff4e00] transition-colors">{icon}</span>
        <span className="text-sm uppercase tracking-widest font-bold text-white">{label}</span>
      </div>
      <ChevronRight size={18} className="text-[#8e9299] group-hover:translate-x-1 transition-transform" />
    </button>
  );
}
