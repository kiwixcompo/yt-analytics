// VidPulse LocalStorage Keyword Vault Store & Management Utility

export type VaultStatus = 'idea' | 'scripted' | 'recorded' | 'published';

export interface VaultKeyword {
  id: string;
  keyword: string;
  collection: string;
  searchVolume?: number;
  competition?: 'Low' | 'Medium' | 'High' | 'Very High' | string;
  overallScore?: number;
  opportunityScore?: number;
  status: VaultStatus;
  recorded: boolean;
  notes?: string;
  addedAt: string;
  updatedAt: string;
  // Metadata generated placeholders (Part 3 integration)
  generatedMetadata?: {
    titles?: string[];
    selectedTitle?: string;
    description?: string;
    tags?: string[];
    scriptOutline?: any;
  };
}

const VAULT_STORAGE_KEY = 'vidpulse_keyword_vault_v1';
const COLLECTIONS_STORAGE_KEY = 'vidpulse_collections_v1';

export const DEFAULT_COLLECTION = 'General Ideas';

export function getSavedKeywords(): VaultKeyword[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to load keywords from vault:', err);
    return [];
  }
}

export function saveKeywordsToVault(
  keywords: Array<{
    keyword: string;
    searchVolume?: number;
    competition?: string;
    overallScore?: number;
    opportunityScore?: number;
  }>,
  collectionName: string = DEFAULT_COLLECTION
): { addedCount: number; duplicateCount: number } {
  if (typeof window === 'undefined') return { addedCount: 0, duplicateCount: 0 };
  
  const existing = getSavedKeywords();
  const existingMap = new Set(existing.map((k) => k.keyword.toLowerCase().trim()));
  const collection = collectionName.trim() || DEFAULT_COLLECTION;

  // Make sure collection is registered
  addCollection(collection);

  let addedCount = 0;
  let duplicateCount = 0;
  const now = new Date().toISOString();

  const newEntries: VaultKeyword[] = [];

  keywords.forEach((item) => {
    const cleanKey = item.keyword.trim();
    if (!cleanKey) return;

    if (existingMap.has(cleanKey.toLowerCase())) {
      duplicateCount++;
      return;
    }

    addedCount++;
    existingMap.add(cleanKey.toLowerCase());
    newEntries.push({
      id: 'vk_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      keyword: cleanKey,
      collection,
      searchVolume: item.searchVolume,
      competition: item.competition,
      overallScore: item.overallScore,
      opportunityScore: item.opportunityScore,
      status: 'idea',
      recorded: false,
      addedAt: now,
      updatedAt: now,
    });
  });

  const updated = [...newEntries, ...existing];
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('vidpulse_vault_updated'));
  } catch (err) {
    console.error('Failed to save to vault:', err);
  }

  return { addedCount, duplicateCount };
}

export function updateVaultKeyword(id: string, updates: Partial<VaultKeyword>): boolean {
  if (typeof window === 'undefined') return false;
  const list = getSavedKeywords();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) return false;

  list[idx] = {
    ...list[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('vidpulse_vault_updated'));
    return true;
  } catch (err) {
    console.error('Failed to update keyword:', err);
    return false;
  }
}

export function deleteVaultKeyword(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const list = getSavedKeywords();
  const filtered = list.filter((item) => item.id !== id);
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('vidpulse_vault_updated'));
    return true;
  } catch (err) {
    console.error('Failed to delete keyword:', err);
    return false;
  }
}

export function deleteMultipleKeywords(ids: string[]): boolean {
  if (typeof window === 'undefined') return false;
  const idSet = new Set(ids);
  const list = getSavedKeywords();
  const filtered = list.filter((item) => !idSet.has(item.id));
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('vidpulse_vault_updated'));
    return true;
  } catch (err) {
    console.error('Failed to delete keywords:', err);
    return false;
  }
}

export function getCollections(): string[] {
  if (typeof window === 'undefined') return [DEFAULT_COLLECTION];
  try {
    const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    const parsed: string[] = raw ? JSON.parse(raw) : [];
    if (!parsed.includes(DEFAULT_COLLECTION)) {
      parsed.unshift(DEFAULT_COLLECTION);
    }
    return parsed;
  } catch {
    return [DEFAULT_COLLECTION];
  }
}

export function addCollection(name: string): string[] {
  if (typeof window === 'undefined') return [DEFAULT_COLLECTION];
  const clean = name.trim();
  if (!clean) return getCollections();

  const cols = getCollections();
  if (!cols.includes(clean)) {
    cols.push(clean);
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(cols));
      window.dispatchEvent(new Event('vidpulse_collections_updated'));
    } catch (e) {
      console.error(e);
    }
  }
  return cols;
}

export function deleteCollection(name: string): void {
  if (typeof window === 'undefined' || name === DEFAULT_COLLECTION) return;
  const cols = getCollections().filter((c) => c !== name);
  try {
    localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(cols));
    // Move existing keywords under this collection back to DEFAULT_COLLECTION
    const list = getSavedKeywords().map((item) =>
      item.collection === name ? { ...item, collection: DEFAULT_COLLECTION } : item
    );
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('vidpulse_vault_updated'));
    window.dispatchEvent(new Event('vidpulse_collections_updated'));
  } catch (e) {
    console.error(e);
  }
}
