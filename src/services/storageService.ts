import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistent Device Storage Service backed by @react-native-async-storage/async-storage
 * Keeps driver JWT tokens, profile data, vehicles, and license verification across app restarts.
 */
class PersistentStorage {
  private memoryCache = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key) || null;
    }
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        this.memoryCache.set(key, value);
      }
      return value;
    } catch {
      return this.memoryCache.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    this.memoryCache.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // Fallback kept in memoryCache
    }
  }

  async removeItem(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    try {
      await AsyncStorage.clear();
    } catch {
      // ignore
    }
  }
}

export const storageService = new PersistentStorage();
