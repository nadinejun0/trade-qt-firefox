// Utility function for relative dates
function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now - date;
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);

  if (diffInSecs < 60) return 'just now';
  if (diffInMins < 60) return `${diffInMins} min${diffInMins === 1 ? '' : 's'} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks === 1 ? '' : 's'} ago`;
  
  return date.toLocaleDateString();
}

// Update notes for a specific user
async function updateNotes(username, notes) {
  try {
    const data = await browser.storage.sync.get('userTradelists');
    const userTradelists = data.userTradelists || {};
    if (userTradelists[username]) {
      // Handle both old (array) and new (object) structures
      if (Array.isArray(userTradelists[username])) {
        const oldItems = userTradelists[username];
        userTradelists[username] = {
          userIdentifier: username,
          notes: notes,
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          items: oldItems
        };
      } else {
        userTradelists[username].notes = notes;
        userTradelists[username].dateModified = new Date().toISOString();
      }
      await browser.storage.sync.set({ userTradelists });
      
      // Update the specific input field's visual state without rebuilding entire display
      updateNotesVisualFeedback(username, notes);
    }
  } catch (error) {
    console.error('Error updating notes:', error);
  }
}

// Update notes visual feedback without rebuilding display
function updateNotesVisualFeedback(username, notes) {
  const input = document.querySelector(`.notes-input[data-username="${username}"]`);
  if (input) {
    // Add visual feedback that notes were saved
    input.style.backgroundColor = '#f0f8ff';
    setTimeout(() => {
      input.style.backgroundColor = '';
    }, 300);
  }
}

// Delete a specific tradelist
async function deleteTradelist(username) {
  try {
    const data = await browser.storage.sync.get('userTradelists');
    const userTradelists = data.userTradelists || {};
    delete userTradelists[username];
    await browser.storage.sync.set({ userTradelists });
    displayTradelists(userTradelists);
  } catch (error) {
    console.error('Error deleting tradelist:', error);
  }
}



// Display tradelists
function displayTradelists(userTradelists) {
  const tradelistList = document.getElementById('tradelist-list');
  
  if (!tradelistList) {
    console.error('tradelist-list element not found');
    return;
  }
  
  if (!userTradelists || Object.keys(userTradelists).length === 0) {
    tradelistList.innerHTML = '<div class="empty-state">No tradelists stored.</div>';
    return;
  }

  let html = '';
  Object.entries(userTradelists).forEach(([username, tradelist]) => {
    console.log(`Processing tradelist for ${username}:`, tradelist); // Debug logging
    
    // Handle both old (array) and new (object) structures
    let items = [];
    let userIdentifier = username;
    let notes = '';
    let dateCreated = '';
    let dateModified = '';
    let pageUrl = '';

    if (Array.isArray(tradelist)) {
      console.log(`${username} uses old array format with ${tradelist.length} items`);
      items = tradelist;
      dateCreated = 'Unknown';
      dateModified = 'Unknown';
    } else if (tradelist.sendingItems || tradelist.receivingItems) {
      // New format with separate sending/receiving items
      const sendingItems = tradelist.sendingItems || [];
      const receivingItems = tradelist.receivingItems || [];
      items = [...sendingItems, ...receivingItems];
      console.log(`${username} uses new format: ${sendingItems.length} sending, ${receivingItems.length} receiving`);
      
      userIdentifier = tradelist.userIdentifier || username;
      notes = tradelist.notes || '';
      dateCreated = tradelist.dateCreated || '';
      dateModified = tradelist.dateModified || '';
      pageUrl = tradelist.pageUrl || '';
    } else {
      // Legacy format with single items array
      items = tradelist.items || [];
      console.log(`${username} uses legacy format with ${items.length} items`);
      
      userIdentifier = tradelist.userIdentifier || username;
      notes = tradelist.notes || '';
      dateCreated = tradelist.dateCreated || '';
      dateModified = tradelist.dateModified || '';
      pageUrl = tradelist.pageUrl || '';
    }

    const itemCount = items.length;
    const relativeDate = dateCreated ? getRelativeTime(dateCreated) : 'Unknown';
    // Use stored pageUrl if available, otherwise construct the URL
    const dtiUrl = pageUrl || `https://impress.openneo.net/user/${userIdentifier}/closet`;

    html += `
      <div class="tradelist-item" data-username="${username}">
        <div class="tradelist-main">
          <div class="tradelist-info">
            <div class="tradelist-header">
              <span class="username">${username}</span>
              <a href="${dtiUrl}" target="_blank" class="dti-link" title="Open DTI closet page">🔗</a>
              <span class="item-count">${itemCount} item${itemCount === 1 ? '' : 's'}</span>
              <span class="date">${relativeDate}</span>
            </div>
            <div class="tradelist-notes">
              <input type="text" class="notes-input" placeholder="Add notes..." value="${notes}" data-username="${username}">
            </div>
          </div>
          <button class="delete-btn" data-username="${username}" title="Delete this tradelist">🗑️</button>
        </div>
      </div>
    `;
  });

  tradelistList.innerHTML = html;

  // Add event listeners for notes inputs
  tradelistList.querySelectorAll('.notes-input').forEach(input => {
    // Store debounce timeout on the input element itself to avoid conflicts
    input.addEventListener('input', (e) => {
      clearTimeout(e.target.debounceTimeout);
      e.target.debounceTimeout = setTimeout(() => {
        updateNotes(e.target.dataset.username, e.target.value);
      }, 500);
    });
  });

  tradelistList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTradelist(e.target.dataset.username);
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const autoCompareToggle = document.getElementById('auto-compare-toggle');
  const showNotepadToggle = document.getElementById('show-notepad-toggle');
  const siteDtiToggle = document.getElementById('site-dti-toggle');
  const siteNeopetsToggle = document.getElementById('site-neopets-toggle');
  const siteJellyneoToggle = document.getElementById('site-jellyneo-toggle');
  const clearAllButton = document.getElementById('clear-all-tradelists');

  // Load current settings and update the UI
  try {
    // Try to load from multiple possible storage keys for backward compatibility
    const data = await browser.storage.sync.get(['settings', 'userTradelists', 'savedTradelists', 'currentTradelist']);
    console.log('Popup loaded data:', data); // Debug logging
    
    const settings = data.settings || {};
    const siteSettings = settings.siteSettings || {};
    
    if (settings.autoCompare) {
      autoCompareToggle.checked = true;
    }
    
    // Default to true if not set (notepad enabled by default)
    if (settings.showNotepad !== false) {
      showNotepadToggle.checked = true;
    } else {
      showNotepadToggle.checked = false;
    }

    // Load site-specific settings (default to enabled)
    siteDtiToggle.checked = siteSettings['impress.openneo.net'] !== false;
    siteNeopetsToggle.checked = siteSettings['neopets.com'] !== false;
    siteJellyneoToggle.checked = siteSettings['jellyneo.net'] !== false;

    // Load tradelists - check both old and new storage formats
    let tradelistsToDisplay = {};
    
    // Check new format first (savedTradelists)
    if (data.savedTradelists && Object.keys(data.savedTradelists).length > 0) {
      console.log('Found savedTradelists:', data.savedTradelists);
      tradelistsToDisplay = data.savedTradelists;
    } 
    // Fallback to old format (userTradelists) 
    else if (data.userTradelists && Object.keys(data.userTradelists).length > 0) {
      console.log('Found userTradelists:', data.userTradelists);
      tradelistsToDisplay = data.userTradelists;
    } 
    // Also check if there's a current working tradelist
    else if (data.currentTradelist && (data.currentTradelist.sendingItems?.length > 0 || data.currentTradelist.receivingItems?.length > 0)) {
      console.log('Found currentTradelist with items:', data.currentTradelist);
      tradelistsToDisplay = {
        'Working List': {
          sendingItems: data.currentTradelist.sendingItems || [],
          receivingItems: data.currentTradelist.receivingItems || [],
          notes: data.currentTradelist.notes || '',
          dateCreated: data.currentTradelist.lastModified || new Date().toISOString(),
          dateModified: data.currentTradelist.lastModified || new Date().toISOString()
        }
      };
    }

    console.log('Displaying tradelists:', tradelistsToDisplay);
    displayTradelists(tradelistsToDisplay);
  } catch (error) {
    console.error('Error loading settings:', error);
    // Show empty state if loading fails
    displayTradelists({});
  }

  // Save settings when the toggles are changed
  autoCompareToggle.addEventListener('change', async () => {
    try {
      const data = await browser.storage.sync.get('settings');
      const settings = data.settings || {};
      settings.autoCompare = autoCompareToggle.checked;
      await browser.storage.sync.set({ settings });
      
      // notify content scripts of setting change
      notifyContentScripts('settingChanged', { autoCompare: autoCompareToggle.checked });
      
      console.log('Auto-compare setting updated:', autoCompareToggle.checked);
    } catch (error) {
      console.error('Error saving autoCompare setting:', error);
    }
  });

  showNotepadToggle.addEventListener('change', async () => {
    try {
      const data = await browser.storage.sync.get('settings');
      const settings = data.settings || {};
      settings.showNotepad = showNotepadToggle.checked;
      await browser.storage.sync.set({ settings });
      
      // notify content scripts of setting change
      notifyContentScripts('settingChanged', { showNotepad: showNotepadToggle.checked });
      
      console.log('Show notepad setting updated:', showNotepadToggle.checked);
    } catch (error) {
      console.error('Error saving showNotepad setting:', error);
    }
  });

  // Site-specific toggle handlers
  siteDtiToggle.addEventListener('change', () => {
    updateSiteSetting('impress.openneo.net', siteDtiToggle.checked);
  });

  siteNeopetsToggle.addEventListener('change', () => {
    updateSiteSetting('neopets.com', siteNeopetsToggle.checked);
  });

  siteJellyneoToggle.addEventListener('change', () => {
    updateSiteSetting('jellyneo.net', siteJellyneoToggle.checked);
  });

  // Function to notify content scripts of setting changes
  async function notifyContentScripts(action, data) {
    try {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('moz-extension://')) {
          try {
            await browser.tabs.sendMessage(tab.id, { action, data });
          } catch (error) {
            // ignore errors for tabs without content script
          }
        }
      }
    } catch (error) {
      console.error('Error notifying content scripts:', error);
    }
  }

  // Function to update site-specific settings
  async function updateSiteSetting(hostname, enabled) {
    try {
      const data = await browser.storage.sync.get('settings');
      const settings = data.settings || {};
      const siteSettings = settings.siteSettings || {};
      siteSettings[hostname] = enabled;
      settings.siteSettings = siteSettings;
      await browser.storage.sync.set({ settings });
      
      // notify content scripts of site setting change
      notifyContentScripts('siteSettingChanged', { hostname, enabled });
      
      console.log(`Site setting for ${hostname} updated:`, enabled);
    } catch (error) {
      console.error('Error updating site setting:', error);
    }
  }

  // Clear all tradelists
  clearAllButton.addEventListener('click', async () => {
    try {
      await browser.storage.sync.set({ userTradelists: {} });
      displayTradelists({});
      // Visual feedback
      const originalText = clearAllButton.textContent;
      clearAllButton.textContent = 'Cleared!';
      clearAllButton.disabled = true;
      setTimeout(() => {
        clearAllButton.textContent = originalText;
        clearAllButton.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Error clearing tradelists:', error);
    }
  });
});
