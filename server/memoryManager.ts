import fs from 'fs';
import path from 'path';

export interface MemoryItem {
  id: string;
  category:
    | 'Identity'
    | 'Preferences'
    | 'Lifestyle'
    | 'Relationships'
    | 'Goals'
    | 'Dislikes'
    | 'Conversation Style'
    | 'Health'
    | 'Project Memory'
    | 'Devices'
    | 'Skills'
    | 'Favorites'
    | 'Important Dates';
  topic: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
  updatedAt: number;
  notes?: string;
}

const MEMORY_FILE_PATH = path.join(process.cwd(), 'data', 'sanaya_memories.json');

// Ensure data directory exists
function ensureDataDirExists() {
  const dataDir = path.dirname(MEMORY_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Load memories from file
export function loadMemories(): MemoryItem[] {
  try {
    ensureDataDirExists();
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const content = fs.readFileSync(MEMORY_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error('[MemoryManager] Error reading memory file:', err);
  }
  return [];
}

// Save memories to file
export function saveMemoriesToFile(memories: MemoryItem[]): boolean {
  try {
    ensureDataDirExists();
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(memories, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[MemoryManager] Error writing memory file:', err);
    return false;
  }
}

// Save or update a single memory topic
export function saveOrUpdateMemory(
  category: MemoryItem['category'],
  topic: string,
  value: string,
  confidence: 'high' | 'medium' | 'low' = 'medium',
  notes?: string
): MemoryItem {
  const memories = loadMemories();
  const normalizedTopic = topic.trim().toLowerCase();
  
  const existingIndex = memories.findIndex(
    (m) => m.topic.trim().toLowerCase() === normalizedTopic || (m.category === category && m.topic.trim().toLowerCase() === normalizedTopic)
  );

  let memoryItem: MemoryItem;

  if (existingIndex >= 0) {
    memories[existingIndex] = {
      ...memories[existingIndex],
      category,
      topic,
      value,
      confidence,
      updatedAt: Date.now(),
      notes: notes || memories[existingIndex].notes,
    };
    memoryItem = memories[existingIndex];
  } else {
    memoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category,
      topic,
      value,
      confidence,
      updatedAt: Date.now(),
      notes,
    };
    memories.push(memoryItem);
  }

  saveMemoriesToFile(memories);
  return memoryItem;
}

// Delete memory by ID or topic
export function deleteMemory(idOrTopic: string): boolean {
  let memories = loadMemories();
  const target = idOrTopic.trim().toLowerCase();

  const initialLength = memories.length;
  memories = memories.filter(
    (m) => m.id !== idOrTopic && m.topic.trim().toLowerCase() !== target
  );

  if (memories.length !== initialLength) {
    saveMemoriesToFile(memories);
    return true;
  }
  return false;
}

// Clear all memories
export function clearAllMemories(): void {
  saveMemoriesToFile([]);
}

// Search memories
export function searchMemories(query?: string, category?: string): MemoryItem[] {
  const memories = loadMemories();
  return memories.filter((m) => {
    if (category && category !== 'All' && m.category.toLowerCase() !== category.toLowerCase()) {
      return false;
    }
    if (query) {
      const q = query.toLowerCase();
      return (
        m.topic.toLowerCase().includes(q) ||
        m.value.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });
}

// Format memories into Markdown for system instructions
export function getFormattedMemoriesForPrompt(): string {
  const memories = loadMemories();

  if (memories.length === 0) {
    return 'No long-term user memories saved yet. Pay attention to conversation and call `saveUserMemory` whenever the user shares meaningful details about their identity, preferences, goals, projects, or dislikes.';
  }

  const categoriesMap: Record<string, MemoryItem[]> = {};

  for (const item of memories) {
    if (!categoriesMap[item.category]) {
      categoriesMap[item.category] = [];
    }
    categoriesMap[item.category].push(item);
  }

  let prompt = 'SANAYA BRAIN & MEMORY BANK (Persistent User Information):\n';
  for (const [cat, items] of Object.entries(categoriesMap)) {
    prompt += `\n[${cat.toUpperCase()}]:\n`;
    for (const item of items) {
      prompt += `- ${item.topic}: "${item.value}" (Confidence: ${item.confidence})${item.notes ? ` [Note: ${item.notes}]` : ''}\n`;
    }
  }

  prompt += '\nMEMORY RULES:\n';
  prompt += '1. Naturally weave relevant memories into conversation when appropriate. DO NOT dump all memories at once.\n';
  prompt += '2. If the user provides updated facts (e.g. new favorite color), call `saveUserMemory` to replace the old memory.\n';
  prompt += '3. If the user asks "Forget that" or "Delete my memory", call `deleteUserMemory` immediately.\n';
  prompt += '4. If user asks "What do you remember about me?", retrieve and summarize these stored facts naturally.';

  return prompt;
}
