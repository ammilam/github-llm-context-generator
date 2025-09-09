const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

class Cache {
  constructor(ttl = 3600) {
    this.memCache = new NodeCache({ 
      stdTTL: ttl / 1000,
      checkperiod: 120,
      useClones: false
    });
    
    this.fileCache = null;
    this.fileCachePath = null;
  }

  async initFileCache(cachePath = './cache') {
    this.fileCachePath = cachePath;
    
    try {
      await fs.mkdir(cachePath, { recursive: true });
      this.fileCache = cachePath;
      return true;
    } catch (error) {
      console.error('Failed to initialize file cache:', error.message);
      return false;
    }
  }

  get(key) {
    return this.memCache.get(key);
  }

  set(key, value, ttl = null) {
    if (ttl) {
      return this.memCache.set(key, value, ttl / 1000);
    }
    return this.memCache.set(key, value);
  }

  has(key) {
    return this.memCache.has(key);
  }

  delete(key) {
    return this.memCache.del(key);
  }

  clear() {
    this.memCache.flushAll();
  }

  getSize() {
    return this.memCache.keys().length;
  }

  getStats() {
    return this.memCache.getStats();
  }

  async saveToFile(key, data) {
    if (!this.fileCache) {
      await this.initFileCache();
    }

    const fileName = this.sanitizeFileName(key);
    const filePath = path.join(this.fileCache, `${fileName}.json`);

    try {
      const cacheData = {
        key,
        data,
        timestamp: Date.now(),
        expires: Date.now() + (this.memCache.options.stdTTL * 1000)
      };
      
      await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2));
      return filePath;
    } catch (error) {
      console.error(`Failed to save cache to file: ${error.message}`);
      return null;
    }
  }

  async loadFromFile(key) {
    if (!this.fileCache) {
      return null;
    }

    const fileName = this.sanitizeFileName(key);
    const filePath = path.join(this.fileCache, `${fileName}.json`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const cacheData = JSON.parse(content);

      if (cacheData.expires && cacheData.expires < Date.now()) {
        await fs.unlink(filePath);
        return null;
      }

      this.set(key, cacheData.data);
      return cacheData.data;
    } catch (error) {
      return null;
    }
  }

  async cleanExpiredFiles() {
    if (!this.fileCache) {
      return 0;
    }

    let cleaned = 0;

    try {
      const files = await fs.readdir(this.fileCache);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.fileCache, file);
          
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const cacheData = JSON.parse(content);
            
            if (cacheData.expires && cacheData.expires < Date.now()) {
              await fs.unlink(filePath);
              cleaned++;
            }
          } catch (error) {
            continue;
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning cache files:', error.message);
    }

    return cleaned;
  }

  sanitizeFileName(key) {
    return key.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 100);
  }

  memoize(fn, keyGenerator = null) {
    return async (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      const cached = this.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const result = await fn(...args);
      this.set(key, result);
      
      return result;
    };
  }

  batch(keys) {
    const results = {};
    const missing = [];

    for (const key of keys) {
      const value = this.get(key);
      if (value !== undefined) {
        results[key] = value;
      } else {
        missing.push(key);
      }
    }

    return { results, missing };
  }

  setMultiple(entries) {
    const results = [];
    
    for (const [key, value, ttl] of entries) {
      const success = this.set(key, value, ttl);
      results.push({ key, success });
    }
    
    return results;
  }

  deleteMultiple(keys) {
    const deleted = [];
    
    for (const key of keys) {
      if (this.delete(key)) {
        deleted.push(key);
      }
    }
    
    return deleted;
  }

  async export() {
    const keys = this.memCache.keys();
    const data = {};
    
    for (const key of keys) {
      data[key] = {
        value: this.get(key),
        ttl: this.memCache.getTtl(key)
      };
    }
    
    return data;
  }

  async import(data) {
    for (const [key, item] of Object.entries(data)) {
      if (item.ttl && item.ttl > Date.now()) {
        const remainingTtl = (item.ttl - Date.now()) / 1000;
        this.set(key, item.value, remainingTtl * 1000);
      }
    }
  }

  getCacheInfo() {
    const stats = this.getStats();
    const keys = this.memCache.keys();
    
    return {
      size: keys.length,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses) || 0,
      keys: keys.slice(0, 10),
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}

module.exports = Cache;