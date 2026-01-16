import React from 'react';
import { AppState } from '../types';
import { Heart, Zap, Trophy, Activity, Award } from 'lucide-react';

interface Props {
  state: AppState;
}

const StatusHUD: React.FC<Props> = ({ state }) => {
  return (
    <div className="w-full p-4 mb-6 rounded-xl border border-white/20 shadow-lg backdrop-blur-md bg-surface text-text transition-all duration-500">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        
        {/* Health */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs uppercase font-bold opacity-80">
            <Heart className="w-4 h-4 text-red-500" fill="currentColor" /> Health
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-red-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${state.health}%` }}></div>
          </div>
        </div>

        {/* Mana */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs uppercase font-bold opacity-80">
            <Zap className="w-4 h-4 text-blue-500" fill="currentColor" /> Mana
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-500 h-2.5 rounded-full relative overflow-hidden transition-all duration-500" style={{ width: `${state.mana}%` }}>
               <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Level & XP */}
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-2 text-xs uppercase font-bold opacity-80">
            <Trophy className="w-4 h-4 text-yellow-500" /> Level {state.level}
          </div>
           <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-yellow-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(state.xp % 100)}%` }}></div>
          </div>
          <div className="text-[10px] text-right">{state.xp} XP</div>
        </div>

         {/* Stress */}
         <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs uppercase font-bold opacity-80">
            <Activity className="w-4 h-4 text-purple-500" /> Stress
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${state.stress}%` }}></div>
          </div>
        </div>

        {/* Badge/Achievement Area (Visual Only) */}
        <div className="flex justify-center items-center">
             {state.level > 1 && (
                 <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-200 to-yellow-500 rounded-full text-white text-xs font-bold shadow-md animate-float">
                     <Award className="w-4 h-4" /> FDA Master
                 </div>
             )}
        </div>

      </div>
    </div>
  );
};

export default StatusHUD;
