// Background script for DTI Trading Assistant
console.log('DTI Trading Assistant background script loaded');

// Handle messages from popup and content scripts
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fetchLebronValues') {
    fetchLebronValues()
      .then(values => {
        sendResponse({ success: true, values: values });
      })
      .catch(error => {
        console.error('Error fetching Lebron values:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  } else if (message.action === 'getStorageInfo') {
    getStorageQuotaInfo()
      .then(info => {
        sendResponse({ success: true, info: info });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  } else if (message.action === 'cleanupData') {
    cleanupOldData()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

// Fetch values from Lebron Values API
async function fetchLebronValues() {
  try {
    console.log('DTI Trading Assistant: Fetching values from Lebron API...');
    const response = await fetch('https://lebron-values.netlify.app/item_values.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('DTI Trading Assistant: API response received:', data);
    
    const neopetsValues = {};
    
    // Process the API data
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(itemName => {
        const value = data[itemName];
        // Normalize item name to lowercase for consistent lookup
        const normalizedName = itemName.toLowerCase();
        neopetsValues[normalizedName] = value;
      });
    }
    
    // Store the values in local storage (higher capacity) instead of sync storage
    // Only store timestamp in sync storage for synchronization
    await browser.storage.local.set({
      neopetsValues: neopetsValues
    });
    
    await browser.storage.sync.set({
      valuesTimestamp: Date.now()
    });
    
    console.log('DTI Trading Assistant: Values updated successfully -', Object.keys(neopetsValues).length, 'items');
    return neopetsValues;
    
  } catch (error) {
    console.error('DTI Trading Assistant: Error fetching Lebron values:', error);
    throw error;
  }
}

// Storage utility functions
async function getStorageQuotaInfo() {
  try {
    if (browser.storage.sync.getBytesInUse) {
      const syncUsed = await browser.storage.sync.getBytesInUse();
      const syncQuota = browser.storage.sync.QUOTA_BYTES || 102400; // 100KB default
      return {
        sync: { used: syncUsed, quota: syncQuota, percentage: (syncUsed / syncQuota) * 100 }
      };
    }
  } catch (error) {
    console.warn('Could not get storage quota info:', error);
  }
  return null;
}

// Clean up old data to prevent storage bloat
async function cleanupOldData() {
  try {
    const result = await browser.storage.sync.get(['userTradelists']);
    const userTradelists = result.userTradelists || {};
    
    // Remove tradelists older than 90 days that haven't been modified
    const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
    let cleanedCount = 0;
    
    Object.keys(userTradelists).forEach(username => {
      const tradelist = userTradelists[username];
      if (tradelist && typeof tradelist === 'object' && tradelist.dateModified) {
        const lastModified = new Date(tradelist.dateModified).getTime();
        if (lastModified < ninetyDaysAgo) {
          delete userTradelists[username];
          cleanedCount++;
        }
      }
    });
    
    if (cleanedCount > 0) {
      await browser.storage.sync.set({ userTradelists });
      console.log(`DTI Trading Assistant: Cleaned up ${cleanedCount} old tradelists`);
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Optional: Auto-refresh values periodically (every 24 hours)
// This could be enabled in a future version with user preferences
function setupAutoRefresh() {
  // Check if we should auto-refresh (every 24 hours)
  browser.storage.sync.get(['valuesTimestamp', 'autoRefreshEnabled'], (result) => {
    const lastUpdate = result.valuesTimestamp || 0;
    const autoRefreshEnabled = result.autoRefreshEnabled || false;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    if (autoRefreshEnabled && (now - lastUpdate > twentyFourHours)) {
      console.log('Auto-refreshing Lebron values...');
      fetchLebronValues().catch(console.error);
    }
  });
}

// Set up alarm for periodic checks (if auto-refresh is enabled)
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'autoRefreshValues') {
    setupAutoRefresh();
  }
});

// Create alarm for checking auto-refresh every hour
browser.alarms.create('autoRefreshValues', { periodInMinutes: 60 });

// Initialize on extension startup
browser.runtime.onStartup.addListener(() => {
  console.log('DTI Trading Assistant extension started');
  setupAutoRefresh();
  // Run cleanup on startup
  setTimeout(cleanupOldData, 5000); // Delay to avoid blocking startup
});

// Initialize on extension install
browser.runtime.onInstalled.addListener((details) => {
  console.log('DTI Trading Assistant extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    // First time install - could show welcome message or fetch initial values
    console.log('First time install - welcome!');
  } else if (details.reason === 'update') {
    // Handle data migration if needed
    migrateStorageData();
  }
});

// Migrate data from sync to local storage for large datasets
async function migrateStorageData() {
  try {
    console.log('DTI Trading Assistant: Checking for data migration...');
    
    // Check if neopetsValues exists in sync storage
    const syncData = await browser.storage.sync.get(['neopetsValues']);
    if (syncData.neopetsValues && Object.keys(syncData.neopetsValues).length > 0) {
      console.log('DTI Trading Assistant: Migrating neopetsValues to local storage...');
      
      // Move to local storage
      await browser.storage.local.set({
        neopetsValues: syncData.neopetsValues
      });
      
      // Remove from sync storage to free up space
      await browser.storage.sync.remove(['neopetsValues']);
      
      console.log('DTI Trading Assistant: Migration completed successfully');
    }
  } catch (error) {
    console.error('DTI Trading Assistant: Error during migration:', error);
  }
}
