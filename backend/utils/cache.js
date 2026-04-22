// backend/utils/cache.js
class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlMs = 3600000) { // Default 1 hour TTL
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(key, { value, expiresAt });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        return this.cache.delete(key);
    }
}

module.exports = new SimpleCache();