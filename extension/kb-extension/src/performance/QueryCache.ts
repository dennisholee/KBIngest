/**
 * Query Result Caching Layer
 * 
 * Provides TTL-based caching for search results and frequent queries
 * with memory-bounded eviction and cache statistics.
 */

/**
 * Cache entry with timestamp and TTL
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  avgHits: number;
}

/**
 * QueryResultCache: Memory-bounded LRU cache with TTL
 * 
 * Features:
 * - Configurable max size and TTL
 * - LRU eviction when at capacity
 * - Automatic TTL expiration
 * - Hit/miss statistics
 */
export class QueryResultCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(maxSizeMb: number = 50, ttlMs: number = 60000) {
    this.maxSize = maxSizeMb * 1024 * 1024; // Convert to bytes (approximate)
    this.ttlMs = ttlMs;
  }

  /**
   * Get cached value if exists and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL expiration
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Hit - increment hit counter
    entry.hits++;
    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set cache value
   */
  set<T>(key: string, value: T): void {
    // Check if we need to evict
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const avgHits = this.cache.size > 0
      ? Array.from(this.cache.values()).reduce((sum, e) => sum + e.hits, 0) / this.cache.size
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      avgHits,
    };
  }

  /**
   * Evict LRU entry
   */
  private _evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < lruTime)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTime = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Generate cache key from search parameters
   */
  static keygen(prefix: string, params: Record<string, unknown>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    return `${prefix}:${sorted}`;
  }
}

/**
 * Cached decorator for methods
 * Usage: @cached(300000) searchFts(...) {}
 */
export function cached(ttlMs: number = 60000) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const cache = new QueryResultCache(50, ttlMs);
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const cacheKey = QueryResultCache.keygen(propertyKey, {
        args: JSON.stringify(args),
      });

      const cached = cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      cache.set(cacheKey, result);
      return result;
    };

    return descriptor;
  };
}
