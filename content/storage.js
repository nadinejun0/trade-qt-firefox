// DTI Trading Assistant - Storage Abstraction Layer

/**
 * storage abstraction layer that handles both sync and local storage
 * with fallback to localStorage when browser storage is unavailable
 */
class StorageManager {
  constructor() {
    this.hasBrowserStorage = typeof browser !== 'undefined' && browser.storage;
    this.syncStorage = this.hasBrowserStorage ? browser.storage.sync : null;
    this.localStorage = this.hasBrowserStorage ? browser.storage.local : null;
  }

  /**
   * load all data from storage
   * @returns {Promise<Object>} loaded data object
   */
  async loadData() {
    try {
      if (this.hasBrowserStorage) {
        return await this._loadFromBrowserStorage();
      } else {
        return this._loadFromLocalStorage();
      }
    } catch (error) {
      console.error('DTI Trading Assistant: Storage load error:', error);
      return this._getDefaultData();
    }
  }

  /**
   * save data to storage
   * @param {Object} data - data to save
   * @returns {Promise<void>}
   */
  async saveData(data) {
    try {
      // update timestamp
      if (data.currentTradelist) {
        data.currentTradelist.lastModified = new Date().toISOString();
      }

      // enforce storage limits
      this._enforceStorageLimits(data);

      if (this.hasBrowserStorage) {
        await this._saveToBrowserStorage(data);
      } else {
        this._saveToLocalStorage(data);
      }
    } catch (error) {
      console.error('DTI Trading Assistant: Storage save error:', error);
      
      if (error.message && error.message.includes('QuotaExceededError')) {
        this._handleQuotaExceeded(data);
        throw new Error(window.ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
      }
      
      throw new Error(window.ERROR_MESSAGES.SAVE_FAILED);
    }
  }

  /**
   * save only neopets values to local storage (large dataset)
   * @param {Object} values - neopets values object
   * @returns {Promise<void>}
   */
  async saveValues(values) {
    try {
      if (this.localStorage) {
        await this.localStorage.set({
          [window.STORAGE.KEYS.NEOPETS_VALUES]: values
        });
      } else {
        localStorage.setItem(`dti_${window.STORAGE.KEYS.NEOPETS_VALUES}`, JSON.stringify(values));
      }
    } catch (error) {
      console.error('DTI Trading Assistant: Values save error:', error);
      throw error;
    }
  }

  /**
   * load data from browser storage (sync + local)
   * @private
   * @returns {Promise<Object>}
   */
  async _loadFromBrowserStorage() {
    const [syncResult, localResult] = await Promise.all([
      this.syncStorage.get([
        window.STORAGE.KEYS.CURRENT_TRADELIST,
        window.STORAGE.KEYS.SAVED_TRADELISTS,
        window.STORAGE.KEYS.USER_TRADELISTS, // legacy
        window.STORAGE.KEYS.SETTINGS
      ]).catch(() => ({})),
      this.localStorage.get([
        window.STORAGE.KEYS.NEOPETS_VALUES
      ]).catch(() => ({}))
    ]);

    console.log('DTI Trading Assistant: Sync storage result:', syncResult);
    console.log('DTI Trading Assistant: Local storage result:', localResult);

    const data = {
      currentTradelist: syncResult[window.STORAGE.KEYS.CURRENT_TRADELIST] || { ...window.DEFAULT_TRADELIST, lastModified: new Date().toISOString() },
      savedTradelists: syncResult[window.STORAGE.KEYS.SAVED_TRADELISTS] || {},
      neopetsValues: localResult[window.STORAGE.KEYS.NEOPETS_VALUES] || {},
      settings: syncResult[window.STORAGE.KEYS.SETTINGS] || { ...window.DEFAULT_SETTINGS }
    };

    // handle migration from old userTradelists format
    const oldUserTradelists = syncResult[window.STORAGE.KEYS.USER_TRADELISTS] || {};
    if (Object.keys(oldUserTradelists).length > 0 && Object.keys(data.savedTradelists).length === 0) {
      console.log('DTI Trading Assistant: Migrating from old userTradelists format...');
      data.savedTradelists = this._migrateFromUserTradelists(oldUserTradelists);
    }

    return data;
  }

  /**
   * save data to browser storage
   * @private
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async _saveToBrowserStorage(data) {
    // save main data to sync storage
    await this.syncStorage.set({
      [window.STORAGE.KEYS.CURRENT_TRADELIST]: data.currentTradelist,
      [window.STORAGE.KEYS.SAVED_TRADELISTS]: data.savedTradelists,
      [window.STORAGE.KEYS.SETTINGS]: data.settings
    });

    // save values to local storage if provided
    if (data.neopetsValues) {
      await this.saveValues(data.neopetsValues);
    }

    console.log('DTI Trading Assistant: Data saved to browser storage successfully');
  }

  /**
   * load data from localStorage fallback
   * @private
   * @returns {Object}
   */
  _loadFromLocalStorage() {
    try {
      const currentTradelist = this._getLocalStorageItem('dti_current_tradelist');
      const savedTradelists = this._getLocalStorageItem('dti_saved_tradelists');
      const userTradelists = this._getLocalStorageItem('dti_user_tradelists'); // legacy
      const neopetsValues = this._getLocalStorageItem('dti_neopets_values');
      const settings = this._getLocalStorageItem('dti_settings');

      const data = {
        currentTradelist: currentTradelist || { ...window.DEFAULT_TRADELIST, lastModified: new Date().toISOString() },
        savedTradelists: savedTradelists || {},
        neopetsValues: neopetsValues || {},
        settings: settings || { ...window.DEFAULT_SETTINGS }
      };

      // handle migration from old format
      if (userTradelists && Object.keys(userTradelists).length > 0 && Object.keys(data.savedTradelists).length === 0) {
        console.log('DTI Trading Assistant: Migrating from old userTradelists format in localStorage...');
        data.savedTradelists = this._migrateFromUserTradelists(userTradelists);
      }

      console.log('DTI Trading Assistant: Loaded from localStorage:', data);
      return data;
    } catch (error) {
      console.error('DTI Trading Assistant: localStorage load error:', error);
      return this._getDefaultData();
    }
  }

  /**
   * save data to localStorage fallback
   * @private
   * @param {Object} data
   */
  _saveToLocalStorage(data) {
    try {
      localStorage.setItem('dti_current_tradelist', JSON.stringify(data.currentTradelist));
      localStorage.setItem('dti_saved_tradelists', JSON.stringify(data.savedTradelists));
      localStorage.setItem('dti_settings', JSON.stringify(data.settings));
      
      if (data.neopetsValues) {
        localStorage.setItem('dti_neopets_values', JSON.stringify(data.neopetsValues));
      }
      
      console.log('DTI Trading Assistant: Saved to localStorage');
    } catch (error) {
      console.error('DTI Trading Assistant: localStorage save error:', error);
      throw error;
    }
  }

  /**
   * get item from localStorage with JSON parsing
   * @private
   * @param {string} key
   * @returns {*}
   */
  _getLocalStorageItem(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  /**
   * get default data structure
   * @private
   * @returns {Object}
   */
  _getDefaultData() {
    return {
      currentTradelist: { ...window.DEFAULT_TRADELIST, lastModified: new Date().toISOString() },
      savedTradelists: {},
      neopetsValues: {},
      settings: { ...window.DEFAULT_SETTINGS }
    };
  }

  /**
   * migrate from old userTradelists format to new saved tradelists
   * @private
   * @param {Object} oldUserTradelists
   * @returns {Object} migrated saved tradelists
   */
  _migrateFromUserTradelists(oldUserTradelists) {
    const savedTradelists = {};
    
    Object.keys(oldUserTradelists).forEach(username => {
      const oldTradelist = oldUserTradelists[username];
      
      // handle different old formats
      let sendingItems = [];
      let receivingItems = [];
      
      if (Array.isArray(oldTradelist)) {
        // very old format - just an array of items
        receivingItems = oldTradelist;
      } else if (oldTradelist.items) {
        // single items array format
        receivingItems = oldTradelist.items;
      } else if (oldTradelist.myOffer || oldTradelist.theirOffer) {
        // dual section format with old naming
        sendingItems = oldTradelist.myOffer || [];
        receivingItems = oldTradelist.theirOffer || [];
      } else if (oldTradelist.sendingItems || oldTradelist.receivingItems) {
        // current dual section format
        sendingItems = oldTradelist.sendingItems || [];
        receivingItems = oldTradelist.receivingItems || [];
      }
      
      // only migrate if there are items
      if (sendingItems.length > 0 || receivingItems.length > 0) {
        const tradelistName = `Trade with ${username}`;
        savedTradelists[tradelistName] = {
          sendingItems: sendingItems,
          receivingItems: receivingItems,
          notes: oldTradelist.notes || '',
          dateCreated: oldTradelist.dateCreated || new Date().toISOString(),
          dateModified: oldTradelist.dateModified || new Date().toISOString()
        };
        
        console.log(`DTI Trading Assistant: Migrated tradelist for ${username} with ${sendingItems.length + receivingItems.length} items`);
      }
    });
    
    console.log(`DTI Trading Assistant: Migration complete. Created ${Object.keys(savedTradelists).length} saved tradelists.`);
    return savedTradelists;
  }

  /**
   * enforce storage limits to prevent bloat
   * @private
   * @param {Object} data
   */
  _enforceStorageLimits(data) {
    if (!data.savedTradelists) return;
    
    const tradelistNames = Object.keys(data.savedTradelists);
    if (tradelistNames.length > window.STORAGE.MAX_SAVED_TRADELISTS) {
      // sort by last modified date, keep the most recent
      const sortedNames = tradelistNames.sort((a, b) => {
        const dateA = data.savedTradelists[a].dateModified || data.savedTradelists[a].dateCreated || 0;
        const dateB = data.savedTradelists[b].dateModified || data.savedTradelists[b].dateCreated || 0;
        return new Date(dateB) - new Date(dateA);
      });
      
      // remove oldest tradelists
      const toRemove = sortedNames.slice(window.STORAGE.MAX_SAVED_TRADELISTS);
      toRemove.forEach(name => {
        delete data.savedTradelists[name];
      });
      
      console.log(`DTI Trading Assistant: Removed ${toRemove.length} old saved tradelists to stay within limit`);
    }
  }

  /**
   * handle quota exceeded error with cleanup
   * @private
   * @param {Object} data
   */
  _handleQuotaExceeded(data) {
    console.warn('DTI Trading Assistant: Storage quota exceeded, attempting cleanup...');
    
    if (data.savedTradelists) {
      const tradelistNames = Object.keys(data.savedTradelists);
      if (tradelistNames.length > 5) {
        // more aggressive cleanup - keep only 5 most recent
        const sortedNames = tradelistNames.sort((a, b) => {
          const dateA = data.savedTradelists[a].dateModified || data.savedTradelists[a].dateCreated || 0;
          const dateB = data.savedTradelists[b].dateModified || data.savedTradelists[b].dateCreated || 0;
          return new Date(dateB) - new Date(dateA);
        });
        
        const toRemove = sortedNames.slice(5);
        toRemove.forEach(name => {
          delete data.savedTradelists[name];
        });
        
        console.log(`DTI Trading Assistant: Emergency cleanup - removed ${toRemove.length} tradelists`);
      }
    }
  }

  /**
   * clean up old data based on age
   * @param {number} maxAgeDays - maximum age in days
   * @returns {Promise<number>} number of items cleaned
   */
  async cleanupOldData(maxAgeDays = window.STORAGE.CLEANUP_AGE_DAYS) {
    try {
      const data = await this.loadData();
      const cutoffDate = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
      let cleanedCount = 0;
      
      if (data.savedTradelists) {
        Object.keys(data.savedTradelists).forEach(name => {
          const tradelist = data.savedTradelists[name];
          if (tradelist && tradelist.dateModified) {
            const lastModified = new Date(tradelist.dateModified).getTime();
            if (lastModified < cutoffDate) {
              delete data.savedTradelists[name];
              cleanedCount++;
            }
          }
        });
      }
      
      if (cleanedCount > 0) {
        await this.saveData(data);
        console.log(`DTI Trading Assistant: Cleaned up ${cleanedCount} old tradelists`);
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('DTI Trading Assistant: Cleanup error:', error);
      return 0;
    }
  }

  /**
   * get storage usage information
   * @returns {Promise<Object|null>} storage usage info or null if unavailable
   */
  async getStorageInfo() {
    try {
      if (this.syncStorage && this.syncStorage.getBytesInUse) {
        const syncUsed = await this.syncStorage.getBytesInUse();
        const syncQuota = this.syncStorage.QUOTA_BYTES || 102400; // 100KB default
        return {
          sync: { 
            used: syncUsed, 
            quota: syncQuota, 
            percentage: (syncUsed / syncQuota) * 100 
          }
        };
      }
    } catch (error) {
      console.warn('DTI Trading Assistant: Could not get storage info:', error);
    }
    return null;
  }
}

// create singleton instance
window.storageManager = new StorageManager();
