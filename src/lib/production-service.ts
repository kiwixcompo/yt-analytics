// VidPulse LocalStorage Production Queue & Keyword Vault Store

export type ProductionStatus = 'ready_to_record' | 'recorded' | 'editing' | 'published';

export interface ProductionScriptSection {
  id?: string;
  sectionName: string;
  estimatedDuration: string;
  tone: string;
  fullScript: string;
  talkingPoints: string[];
  visualCues: string;
  retentionStrategy: string;
}

export interface ProductionItem {
  id: string;
  topic: string;
  title: string;
  status: ProductionStatus;
  collection: string;
  targetAudience?: string;
  videoStyle?: string;
  estimatedDuration?: string;
  pacing?: string;
  
  // High-CTR Metadata Package
  metadata?: {
    titles: string[];
    selectedTitle: string;
    description: string;
    tags: string[];
    thumbnailHookConcept?: {
      visualLayout: string;
      textOverlay: string;
      colorScheme: string;
    };
  };

  // 5-Stage Retention Script
  script?: {
    totalEstimatedDuration: string;
    recommendedPacing: string;
    sections: ProductionScriptSection[];
  };

  // Production checklist / notes
  notes?: string;
  recordedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const PRODUCTION_STORAGE_KEY = 'vidpulse_production_pipeline_v1';
export const DEFAULT_PRODUCTION_COLLECTION = 'Main Queue';

export function getProductionItems(): ProductionItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load production pipeline:', err);
    return [];
  }
}

export function saveToProductionPipeline(item: {
  topic: string;
  title: string;
  collection?: string;
  metadata?: ProductionItem['metadata'];
  script?: ProductionItem['script'];
  status?: ProductionStatus;
  notes?: string;
}): ProductionItem {
  if (typeof window === 'undefined') {
    return {} as ProductionItem;
  }

  const existing = getProductionItems();
  const now = new Date().toISOString();

  // Check if item with exact same title or topic already exists
  const existingIdx = existing.findIndex(
    (p) =>
      p.title.trim().toLowerCase() === item.title.trim().toLowerCase() ||
      p.topic.trim().toLowerCase() === item.topic.trim().toLowerCase()
  );

  let savedItem: ProductionItem;

  if (existingIdx >= 0) {
    // Update existing item
    savedItem = {
      ...existing[existingIdx],
      title: item.title || existing[existingIdx].title,
      topic: item.topic || existing[existingIdx].topic,
      collection: item.collection || existing[existingIdx].collection || DEFAULT_PRODUCTION_COLLECTION,
      metadata: item.metadata || existing[existingIdx].metadata,
      script: item.script || existing[existingIdx].script,
      status: item.status || existing[existingIdx].status || 'ready_to_record',
      notes: item.notes !== undefined ? item.notes : existing[existingIdx].notes,
      updatedAt: now,
    };
    existing[existingIdx] = savedItem;
  } else {
    // Create new
    savedItem = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      topic: item.topic,
      title: item.title,
      status: item.status || 'ready_to_record',
      collection: item.collection || DEFAULT_PRODUCTION_COLLECTION,
      metadata: item.metadata,
      script: item.script,
      notes: item.notes || '',
      createdAt: now,
      updatedAt: now,
    };
    existing.unshift(savedItem);
  }

  try {
    localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event('vidpulse_production_updated'));
  } catch (e) {
    console.error('Failed to save to production pipeline:', e);
  }

  return savedItem;
}

export function updateProductionItem(
  id: string,
  updates: Partial<ProductionItem>
): boolean {
  if (typeof window === 'undefined') return false;
  const list = getProductionItems();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('vidpulse_production_updated'));
    return true;
  } catch (e) {
    console.error('Failed to update production item:', e);
    return false;
  }
}

export function deleteProductionItem(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const list = getProductionItems();
  const filtered = list.filter((p) => p.id !== id);
  try {
    localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('vidpulse_production_updated'));
    return true;
  } catch (e) {
    console.error('Failed to delete production item:', e);
    return false;
  }
}

export function deleteMultipleProductionItems(ids: string[]): boolean {
  if (typeof window === 'undefined') return false;
  const idSet = new Set(ids);
  const list = getProductionItems();
  const filtered = list.filter((p) => !idSet.has(p.id));
  try {
    localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('vidpulse_production_updated'));
    return true;
  } catch (e) {
    console.error('Failed to delete production items:', e);
    return false;
  }
}
