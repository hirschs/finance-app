interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * In-memory TTL cache. If a refresh fails but an older value exists, that value is
 * served instead of the error, so a Yahoo hiccup does not blank the dashboard.
 * (Quote and series carry their own `asOf` / timestamps, so data age stays visible.)
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, Entry<T>>();

  constructor(private readonly now: () => number = Date.now) {}

  async getOrLoad(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt > this.now()) return entry.value;

    try {
      const value = await load();
      this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
      return value;
    } catch (err) {
      if (entry) return entry.value;
      throw err;
    }
  }
}
