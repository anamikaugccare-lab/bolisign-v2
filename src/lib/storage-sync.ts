import { CustomSign } from './types';

const STORAGE_KEY = 'bolisign_custom_signs_v5';
const DELETED_SIGNS_KEY = 'bolisign_deleted_sign_ids_v5';

/**
 * Get all deleted sign IDs/names stored in localStorage.
 */
export function getDeletedSignIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    // Purge legacy storage versions once
    try {
      localStorage.removeItem('bolisign_custom_signs_v1');
      localStorage.removeItem('bolisign_custom_signs_v2');
      localStorage.removeItem('bolisign_custom_signs_v3');
      localStorage.removeItem('bolisign_custom_signs_v4');
    } catch (e) {}

    const raw = localStorage.getItem(DELETED_SIGNS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.warn('Failed to parse deleted sign IDs:', e);
  }
  return new Set();
}

/**
 * Mark a sign ID as deleted persistently.
 */
export function markSignDeleted(signId: string) {
  if (typeof window === 'undefined') return;
  try {
    const set = getDeletedSignIds();
    set.add(signId);
    localStorage.setItem(DELETED_SIGNS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Error recording deleted sign ID:', e);
  }
}

/**
 * Clear all deleted sign markers (used when restoring defaults).
 */
export function clearDeletedSignIds() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DELETED_SIGNS_KEY);
  } catch (e) {
    console.error('Error clearing deleted sign IDs:', e);
  }
}

/**
 * Fetch all signs merged from both LocalStorage (client backup) and Backend API.
 * Any sign marked as deleted will be excluded.
 */
export async function getMergedSigns(): Promise<CustomSign[]> {
  const deletedIds = getDeletedSignIds();

  let apiSigns: CustomSign[] = [];
  try {
    const res = await fetch('/api/signs', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && Array.isArray(data.signs)) {
      apiSigns = data.signs;
    }
  } catch (err) {
    console.warn('API fetch signs fallback to local storage:', err);
  }

  // Load client-side localStorage backup
  let localSigns: CustomSign[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localSigns = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage signs:', e);
    }
  }

  // Strictly deduplicate by normalized Hindi name!
  const byName = new Map<string, CustomSign>();

  const processSign = (s: CustomSign) => {
    if (!s || !s.nameHindi) return;
    const name = s.nameHindi.trim();
    if (!name) return;
    
    // Explicitly reject old temporary test signs
    if (s.id === 'sign-custom-1791134835554' || s.id === 'sign-custom-1791134621133' || name === 'मदद') {
      return;
    }

    const key = name.toLowerCase();

    // Check if deleted
    if (deletedIds.has(s.id) || deletedIds.has(name) || deletedIds.has(key)) {
      return;
    }

    if (!byName.has(key)) {
      byName.set(key, s);
    } else {
      // If sign already exists, prefer the one with custom trained data
      const existing = byName.get(key)!;
      const existingHasData = (existing.landmarksSample && existing.landmarksSample.length > 0) || existing.fingerSignature;
      const sHasData = (s.landmarksSample && s.landmarksSample.length > 0) || s.fingerSignature;
      if (!existingHasData && sHasData) {
        byName.set(key, s);
      }
    }
  };

  // Process API signs first, then local signs
  apiSigns.forEach(processSign);
  localSigns.forEach(processSign);

  const merged = Array.from(byName.values());

  // Update localStorage with clean, deduplicated set
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {}
  }

  return merged;
}

/**
 * Save a new custom sign to both LocalStorage and Backend API.
 * Also removes any previous deletion marker for this sign name.
 */
export async function saveSignPersistently(signData: Partial<CustomSign>): Promise<CustomSign> {
  const normName = (signData.nameHindi || '').trim();

  // If this sign was previously deleted, un-delete it
  if (typeof window !== 'undefined') {
    const deletedIds = getDeletedSignIds();
    if (signData.id && deletedIds.has(signData.id)) {
      deletedIds.delete(signData.id);
    }
    if (normName && deletedIds.has(normName)) {
      deletedIds.delete(normName);
    }
    if (normName && deletedIds.has(normName.toLowerCase())) {
      deletedIds.delete(normName.toLowerCase());
    }
    localStorage.setItem(DELETED_SIGNS_KEY, JSON.stringify(Array.from(deletedIds)));
  }

  let savedSign: CustomSign | null = null;

  try {
    const res = await fetch('/api/signs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...signData,
        nameHindi: normName
      })
    });
    const data = await res.json();
    if (data.success && data.sign) {
      savedSign = data.sign;
    }
  } catch (err) {
    console.warn('API save sign failed, falling back to local storage:', err);
  }

  // Fallback if API fails or is read-only
  if (!savedSign) {
    savedSign = {
      id: signData.id || `sign-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nameHindi: normName || 'नया साइन',
      nameEnglish: signData.nameEnglish || normName || 'New Sign',
      category: signData.category || 'custom',
      landmarksSample: signData.landmarksSample || [],
      fingerSignature: signData.fingerSignature,
      bodyLocation: signData.bodyLocation || 'neutral',
      signType: signData.signType || 'static',
      motionDirection: signData.motionDirection || 'none',
      endBodyLocation: signData.endBodyLocation,
      recordedBy: signData.recordedBy || 'College Staff',
      createdAt: new Date().toISOString()
    };
  }

  // Always persist in localStorage with strict deduplication
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: CustomSign[] = stored ? JSON.parse(stored) : [];
      const lower = (savedSign.nameHindi || '').trim().toLowerCase();
      const updated = [
        ...list.filter(s => s.id !== savedSign!.id && (s.nameHindi || '').trim().toLowerCase() !== lower),
        savedSign
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('bolisign-signs-updated'));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  return savedSign;
}

/**
 * Delete a sign (either default or custom) from LocalStorage, deletion registry, and Backend API.
 */
export async function deleteSignPersistently(signId: string, signNameHindi?: string): Promise<boolean> {
  // 1. Mark as permanently deleted in local registry
  markSignDeleted(signId);
  if (signNameHindi) {
    markSignDeleted(signNameHindi);
  }

  // 2. Remove from LocalStorage list
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const list: CustomSign[] = JSON.parse(stored);
        const filtered = list.filter(s => s.id !== signId && s.nameHindi !== signNameHindi);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.error('Error deleting from localStorage:', e);
    }
  }

  // 3. Notify backend API to delete
  try {
    await fetch(`/api/signs?id=${encodeURIComponent(signId)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('API delete sign error:', err);
  }

  // 4. Trigger global reactive update
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bolisign-signs-updated'));
  }

  return true;
}

/**
 * Reset all signs back to default factory baseline ISL signs.
 */
export async function restoreDefaultSignsPersistently(): Promise<CustomSign[]> {
  clearDeletedSignIds();

  let restored: CustomSign[] = [];
  try {
    const res = await fetch('/api/signs?action=reset', { method: 'POST' });
    const data = await res.json();
    if (data.success && Array.isArray(data.signs)) {
      restored = data.signs;
    }
  } catch (err) {
    console.warn('API reset failed, resetting locally:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored));
      window.dispatchEvent(new Event('bolisign-signs-updated'));
    } catch (e) {}
  }

  return restored;
}

/**
 * Permanently clear ALL signs from both LocalStorage, deleted registry, and backend database.
 */
export async function clearAllSignsPersistently(): Promise<boolean> {
  // Mark all known default signs and any custom signs as deleted
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const list: CustomSign[] = stored ? JSON.parse(stored) : [];
      const delSet = getDeletedSignIds();

      // Mark all custom and default signs as deleted
      list.forEach(s => {
        if (s.id) delSet.add(s.id);
        if (s.nameHindi) {
          delSet.add(s.nameHindi.trim());
          delSet.add(s.nameHindi.trim().toLowerCase());
        }
      });

      // Also mark all default IDs
      try {
        const res = await fetch('/api/signs', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.signs)) {
          data.signs.forEach((s: CustomSign) => {
            if (s.id) delSet.add(s.id);
            if (s.nameHindi) {
              delSet.add(s.nameHindi.trim());
              delSet.add(s.nameHindi.trim().toLowerCase());
            }
          });
        }
      } catch (err) {}

      localStorage.setItem(DELETED_SIGNS_KEY, JSON.stringify(Array.from(delSet)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Error clearing signs locally:', e);
    }
  }

  // Clear on backend
  try {
    await fetch('/api/signs?action=clear_all', { method: 'DELETE' });
  } catch (err) {
    console.warn('API clear all signs error:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bolisign-signs-updated'));
  }

  return true;
}
