import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Globe, Clock, Search, AppWindow, MessageSquare, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToolCallItem, TranscriptionMessage } from '../types';

interface ActionDrawerProps {
  toolCalls: ToolCallItem[];
  transcriptions: TranscriptionMessage[];
}

const ActionDrawerComponent: React.FC<ActionDrawerProps> = ({
  toolCalls,
  transcriptions,
}) => {
  const [activeTab, setActiveTab] = useState<'transcriptions' | 'actions'>('transcriptions');
  const [isExpanded, setIsExpanded] = useState(true);

  if (toolCalls.length === 0 && transcriptions.length === 0) {
    return (
      <div className="w-full max-w-xl mx-auto mt-4 px-4">
        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-center text-xs text-slate-400">
          <p>💡 Tip: Ask Sanaya "What time is it?", "Open Google", or "Search for latest tech news".</p>
        </div>
      </div>
    );
  }

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'openWebsite':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'getCurrentTime':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'searchWeb':
        return <Search className="w-4 h-4 text-amber-400" />;
      case 'openApplication':
        return <AppWindow className="w-4 h-4 text-purple-400" />;
      default:
        return <Terminal className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-4 px-4 z-10">
      <div className="bg-slate-900/70 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
        {/* Header Toggle bar */}
        <div className="px-4 py-2.5 bg-slate-800/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('transcriptions')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'transcriptions'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Voice Subtitles ({transcriptions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeTab === 'actions'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Function Logs ({toolCalls.length})</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Content Body */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-h-56 overflow-y-auto p-3 space-y-2 text-xs divide-y divide-white/5 scrollbar-thin scrollbar-thumb-slate-700"
            >
              {activeTab === 'transcriptions' ? (
                transcriptions.length === 0 ? (
                  <p className="text-slate-500 italic text-center py-3">No voice transcriptions yet...</p>
                ) : (
                  transcriptions.slice(-10).map((msg) => (
                    <div key={msg.id} className="pt-2 first:pt-0 flex space-x-2">
                      <span
                        className={`font-semibold shrink-0 ${
                          msg.source === 'sanaya' ? 'text-pink-400' : 'text-blue-400'
                        }`}
                      >
                        {msg.source === 'sanaya' ? 'Sanaya:' : 'You:'}
                      </span>
                      <p className="text-slate-200 leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                )
              ) : toolCalls.length === 0 ? (
                <p className="text-slate-500 italic text-center py-3">No functions executed yet...</p>
              ) : (
                toolCalls.slice(-8).map((tool) => (
                  <div key={tool.id} className="pt-2 first:pt-0 flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2">
                      <div className="mt-0.5">{getToolIcon(tool.name)}</div>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
                          <span>{tool.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({JSON.stringify(tool.args)})
                          </span>
                        </div>
                        {tool.result && (
                          <p className="text-[11px] text-emerald-400/90 font-mono mt-0.5">
                            → {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-[10px]">
                      {tool.status === 'completed' ? (
                        <span className="text-emerald-400 flex items-center space-x-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Done</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center space-x-0.5">
                          <AlertCircle className="w-3 h-3 animate-spin" />
                          <span>Running</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ActionDrawer = React.memo(ActionDrawerComponent);

