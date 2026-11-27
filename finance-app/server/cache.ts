interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache. If a refresh fails but an older value exists, that value is
 * served instead of the error, so a Yahoo hiccup does not blank the dashboard.
 * (Quote and series carry their own `asOf` / timestamps, so data age stays visible.)
 * `maxEntries` bounds memory when keys come from user input; the oldest entry is evicted first.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = Infinity,
  ) {}

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt > this.now()) return entry.value;

    try {
      const value = await load();
      this.entries.delete(key);
      this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
      if (this.entries.size > this.maxEntries) {
        const oldest = this.entries.keys().next().value;
        if (oldest !== undefined) this.entries.delete(oldest);
      }
      return value;
    } catch (err) {
      if (entry) return entry.value;
      throw err;
    }
  }
}
