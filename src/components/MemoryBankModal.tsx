import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit3,
  X,
  Sparkles,
  RefreshCw,
  Check,
  ShieldCheck,
  HelpCircle,
  Tag,
  Clock,
  ChevronRight,
  Database,
  Filter,
} from 'lucide-react';
import { MemoryItem } from '../types';

interface MemoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskSanayaAboutMemories?: () => void;
}

const CATEGORIES: MemoryItem['category'][] = [
  'Identity',
  'Preferences',
  'Lifestyle',
  'Relationships',
  'Goals',
  'Dislikes',
  'Conversation Style',
  'Health',
  'Project Memory',
  'Devices',
  'Skills',
  'Favorites',
  'Important Dates',
];

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  onClose,
  onAskSanayaAboutMemories,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Form state for creating / editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<MemoryItem['category']>('Preferences');
  const [formTopic, setFormTopic] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formConfidence, setFormConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [formNotes, setFormNotes] = useState('');

  const [confirmClear, setConfirmClear] = useState(false);

  const fetchMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
    } catch (err) {
      console.error('[MemoryBankModal] Error fetching memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMemories();
    }
  }, [isOpen, fetchMemories]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchMemories();
    };
    window.addEventListener('sanaya_memory_updated', handleUpdate);
    return () => {
      window.removeEventListener('sanaya_memory_updated', handleUpdate);
    };
  }, [fetchMemories]);

  if (!isOpen) return null;

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTopic.trim() || !formValue.trim()) return;

    try {
      const payload = {
        category: formCategory,
        topic: formTopic.trim(),
        value: formValue.trim(),
        confidence: formConfidence,
        notes: formNotes.trim() || undefined,
      };

      if (editingId) {
        await fetch(`/api/memories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/memories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      resetForm();
      fetchMemories();
    } catch (err) {
      console.error('[MemoryBankModal] Error saving memory:', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
      fetchMemories();
    } catch (err) {
      console.error('[MemoryBankModal] Error deleting memory:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch('/api/memories/clear', { method: 'DELETE' });
      setConfirmClear(false);
      fetchMemories();
    } catch (err) {
      console.error('[MemoryBankModal] Error clearing memories:', err);
    }
  };

  const startEdit = (item: MemoryItem) => {
    setEditingId(item.id);
    setFormCategory(item.category);
    setFormTopic(item.topic);
    setFormValue(item.value);
    setFormConfidence(item.confidence);
    setFormNotes(item.notes || '');
    setIsEditing(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormTopic('');
    setFormValue('');
    setFormNotes('');
    setFormConfidence('high');
    setFormCategory('Preferences');
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory =
      selectedCategory === 'All' || m.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      m.topic.toLowerCase().includes(query) ||
      m.value.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query) ||
      (m.notes && m.notes.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  const confidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>High Confidence</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Medium</span>
          </span>
        );
      case 'low':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Low</span>
          </span>
        );
    }
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-900/40 via-slate-900 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30 border border-white/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Sanaya's Brain & Memory System</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                  Persistent Long-Term
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Remembers facts, preferences, identity & goals across conversations and restarts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMemories}
              title="Refresh Memories"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search memories by topic, value, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Memory</span>
            </button>

            {memories.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center space-x-1 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Forget All</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-white/5 overflow-x-auto flex items-center space-x-1.5 scrollbar-thin">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            All ({memories.length})
          </button>

          {CATEGORIES.map((cat) => {
            const count = memories.filter((m) => m.category === cat).length;
            if (count === 0 && selectedCategory !== cat) return null;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap flex items-center space-x-1 ${
                  selectedCategory === cat
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                }`}
              >
                <span>{cat}</span>
                {count > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-700 text-slate-300 font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Confirmation Modal overlay for Clear All */}
          {confirmClear && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between text-rose-200 text-xs">
              <div className="flex items-center space-x-2">
                <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold">Clear all memories from Sanaya's Brain?</p>
                  <p className="text-slate-300">Sanaya will forget all identity, preference, and project details.</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-500 transition"
                >
                  Yes, Erase
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Form Overlay for Add / Edit */}
          {isEditing && (
            <form
              onSubmit={handleSaveMemory}
              className="p-5 bg-slate-850 border border-purple-500/40 rounded-2xl space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{editingId ? 'Edit Memory' : 'Add New Memory'}</span>
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Topic / Key</label>
                  <input
                    type="text"
                    placeholder="e.g. favorite_color, partner_name, current_project"
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Value / Fact</label>
                <textarea
                  placeholder="e.g. Black, Dog named Bruno, Building an AI voice app"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confidence</label>
                  <select
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="high">High (Repeated or explicit)</option>
                    <option value="medium">Medium (Mentioned once)</option>
                    <option value="low">Low (Uncertain)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="Additional context or timing"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-purple-600/30"
                >
                  {editingId ? 'Save Changes' : 'Create Memory'}
                </button>
              </div>
            </form>
          )}

          {/* Memory List Items */}
          {filteredMemories.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                <Database className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                {searchQuery
                  ? 'No matching memories found.'
                  : 'Sanaya has no saved long-term memories in this category.'}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                During live voice conversation, tell Sanaya facts about yourself (like your hobbies, job, favorite foods, or projects) and she will automatically store them in her persistent memory!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMemories.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-slate-800/60 border border-slate-700/80 hover:border-purple-500/40 rounded-2xl flex flex-col justify-between space-y-3 transition shadow-lg group"
                >
                  <div>
                    {/* Top Tag Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-2">
                        {confidenceBadge(item.confidence)}
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatTimestamp(item.updatedAt)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Topic & Value */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {item.topic.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        {item.value}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-slate-400 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[10px] text-slate-500">ID: {item.id.substring(0, 10)}</span>
                    <div className="flex items-center space-x-2 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                        title="Edit Memory"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMemory(item.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Brain Status: Active & Auto-syncing</span>
          </div>

          {onAskSanayaAboutMemories && (
            <button
              onClick={() => {
                onClose();
                onAskSanayaAboutMemories();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-xl font-medium flex items-center space-x-1.5 transition border border-purple-500/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Ask Sanaya "What do you remember?"</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
