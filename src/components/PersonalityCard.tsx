import React from 'react';
import { Sparkles, MessageCircle, Heart, Zap, Smile, Compass } from 'lucide-react';

interface PersonalityCardProps {
  onPromptClick: (promptText: string) => void;
  isConnected: boolean;
}

const PersonalityCardComponent: React.FC<PersonalityCardProps> = ({
  onPromptClick,
  isConnected,
}) => {
  const examplePrompts = [
    { text: "Sanaya, recommend a great movie with a witty summary!", lang: "English" },
    { text: "Arey Sanaya, time kya ho raha hai waise?", lang: "Hinglish" },
    { text: "Open Google and search for latest AI news.", lang: "Tool" },
    { text: "Sanaya, give me a boost of witty motivation!", lang: "Humor" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-4 px-4">
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sanaya's Personality Profile</h3>
              <p className="text-[11px] text-slate-400">Confident • Charming • Witty • Hinglish Aware</p>
            </div>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30">
            Voice Companion
          </span>
        </div>

        {/* Quick Conversation Starters */}
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Try Saying These to Sanaya:</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {examplePrompts.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onPromptClick(item.text)}
                disabled={!isConnected}
                className={`p-2.5 rounded-xl text-left text-xs transition border flex items-start space-x-2 ${
                  isConnected
                    ? 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-200 border-white/10 hover:border-purple-400/40 cursor-pointer'
                    : 'bg-slate-900/40 text-slate-500 border-white/5 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-pink-400 mt-0.5">💬</span>
                <span className="line-clamp-2 leading-relaxed">{item.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PersonalityCard = React.memo(PersonalityCardComponent);

