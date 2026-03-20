import React from 'react';
import StatusBar from './Quest/StatusBar';
import ChatLog from './Quest/ChatLog';
import ActionMenu from './Quest/ActionMenu';
import DiceOverlay from './Quest/DiceOverlay';
import DiceRoller from './DiceRoller';
import { useGameEngine } from '../hooks/useGameEngine';

export default function QuestView() {
  const engine = useGameEngine();

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto relative overflow-hidden">
      <StatusBar />
      <ChatLog isAILoading={engine.isAILoading} />
      <DiceOverlay rollResult={engine.rollResult} />
      <ActionMenu engine={engine} />
      {engine.pendingRoll && <DiceRoller onSettle={engine.resolveRoll} count={engine.pendingRoll.count} sides={engine.pendingRoll.sides} />}
    </div>
  );
}
