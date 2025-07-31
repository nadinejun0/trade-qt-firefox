// DTI Trading Assistant - Main Content Script

console.log('DTI Trading Assistant content script loaded');

// global state
let lastUrl = location.href;
let currentTradelist = {
  sendingItems: [],
  receivingItems: [],
  notes: '',
  lastModified: new Date().toISOString()
};
let savedTradelists = {};
let neopetsValues = {};
let listContainer;
let toggleButton;
let isMinimized = true;
let currentUsername = '';

/**
 * check if current site should show the extension
 * @returns {boolean}
 */
function shouldShowExtension() {
  const hostname = window.location.hostname.toLowerCase();
  
  // check if this is a supported site by default
  if (window.SUPPORTED_SITES[hostname]) {
    return true;
  }
  
  // check for partial matches (e.g., subdomain.neopets.com)
  for (const site in window.SUPPORTED_SITES) {
    if (hostname.includes(site) || site.includes(hostname)) {
      return true;
    }
  }
  
  return false;
}

/**
 * load data from storage
 * @returns {Promise<Object>} settings object
 */
async function loadData() {
  try {
    const data = await window.storageManager.loadData();
    
    currentTradelist = data.currentTradelist;
    savedTradelists = data.savedTradelists;
    neopetsValues = data.neopetsValues;
    
    console.log('DTI Trading Assistant: Data loaded successfully');
    return data.settings;
  } catch (error) {
    console.error('DTI Trading Assistant: Error loading data:', error);
    return {};
  }
}

/**
 * save data to storage
 * @returns {Promise<void>}
 */
async function saveData() {
  try {
    await window.storageManager.saveData({
      currentTradelist,
      savedTradelists,
      neopetsValues
    });
    console.log('DTI Trading Assistant: Data saved successfully');
  } catch (error) {
    console.error('DTI Trading Assistant: Error saving data:', error);
    if (error.message.includes('quota')) {
      showStatusMessage(window.ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED, 'error');
    } else {
      showStatusMessage(window.ERROR_MESSAGES.SAVE_FAILED, 'error');
    }
  }
}

/**
 * get auto-populated value for an item
 * @param {string} itemName - item name
 * @returns {string} auto value or empty string
 */
function getAutoValue(itemName) {
  const key = itemName.toLowerCase();
  return neopetsValues[key] || '';
}

/**
 * handle copy button click
 * @param {Event} e - click event
 * @param {HTMLElement} objectEl - item element
 */
async function handleCopyClick(e, objectEl) {
  e.stopPropagation();
  e.preventDefault();

  const itemName = window.DOMUtils.getItemName(objectEl);
  if (!itemName) return;

  const button = e.currentTarget;
  const originalHTML = button.innerHTML;

  try {
    await window.copyToClipboard(itemName);
    
    // visual feedback for success
    button.innerHTML = '✓';
    setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1000);
  } catch (error) {
    console.error('DTI Trading Assistant: Failed to copy item name:', error);
    
    // visual feedback for error
    button.innerHTML = '✗';
    setTimeout(() => {
      button.innerHTML = originalHTML;
    }, 1000);
  }
}

/**
 * handle add button click
 * @param {Event} e - click event
 * @param {HTMLElement} objectEl - item element
 */
function handleAddClick(e, objectEl) {
  e.stopPropagation();
  e.preventDefault();

  const itemName = window.DOMUtils.getItemName(objectEl);
  if (!itemName) return;

  const sourceSection = window.DOMUtils.getItemSection(objectEl);
  addToList(itemName, sourceSection);
  
  // visual feedback
  const button = e.currentTarget;
  const originalText = button.textContent;
  button.textContent = '✓';
  setTimeout(() => {
    button.textContent = originalText;
  }, 1000);
}

/**
 * create floating toggle button
 */
function createToggleButton() {
  console.log('DTI Trading Assistant: Creating toggle button...');
  toggleButton = window.DOMUtils.createToggleButton();
  toggleButton.addEventListener('click', toggleNotepad);
  document.body.appendChild(toggleButton);
  console.log('DTI Trading Assistant: Toggle button created and added to body');
}

/**
 * toggle notepad visibility
 */
function toggleNotepad() {
  console.log('DTI Trading Assistant: Toggle notepad clicked, isMinimized:', isMinimized);
  
  if (!listContainer) {
    console.error('DTI Trading Assistant: listContainer is null!');
    return;
  }
  
  isMinimized = !isMinimized;
  window.DOMUtils.toggleVisibility(listContainer, !isMinimized);
  toggleButton.textContent = isMinimized ? '+' : '−';
  
  console.log('DTI Trading Assistant: Notepad toggled, visible:', !isMinimized);
}

/**
 * create notepad
 */
function createNotepad() {
  console.log('DTI Trading Assistant: Creating notepad...');
  
  listContainer = window.DOMUtils.createNotepadContainer();
  
  // create header
  const headerContent = generateHeaderContent();
  const header = window.DOMUtils.createNotepadHeader(headerContent);
  
  // create content area
  const content = window.DOMUtils.createNotepadContent();
  
  // create balance bar
  const balanceBar = window.DOMUtils.createBalanceBar('0 OWLs', '0 OWLs');
  
  listContainer.appendChild(header);
  listContainer.appendChild(content);
  listContainer.appendChild(balanceBar);
  document.body.appendChild(listContainer);

  // attach event listeners
  attachHeaderEventListeners(header);
  
  updateListDisplay();
}

/**
 * attach event listeners to header buttons
 * @param {HTMLElement} header - header element
 */
function attachHeaderEventListeners(header) {
  header.querySelector('.dti-save-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showSaveDialog();
  });
  
  header.querySelector('.dti-load-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showLoadDialog();
  });
  
  header.querySelector('.dti-refresh-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    refreshValues();
  });
  
  header.querySelector('.dti-copy-all-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    copyAllItems();
  });
  
  header.querySelector('.dti-clear-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearList();
  });
  
  const compareBtn = header.querySelector('.dti-compare-btn');
  if (window.location.hostname === 'impress.openneo.net') {
    compareBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompare();
    });
  } else {
    if (compareBtn) compareBtn.style.display = 'none';
  }
}

/**
 * apply auto-compare mode on page load
 */
function applyAutoCompare() {
  if (window.location.hostname !== 'impress.openneo.net') {
    return;
  }

  const hangersEl = document.querySelector(window.SELECTORS.CLOSET_HANGERS) ||
                   document.querySelector(window.SELECTORS.CLOSET_HANGERS_ALT) ||
                   document.querySelector('[id*="hanger"]') ||
                   document.querySelector('#hangers') ||
                   document.querySelector('.hangers') ||
                   document.body;

  if (hangersEl) {
    console.log('DTI Trading Assistant: Applying auto-compare mode');
    hangersEl.classList.add('comparing');
    
    // highlight wanted items automatically
    const wantedItemNames = currentTradelist.receivingItems.map(item => item.name);
    if (wantedItemNames.length > 0) {
      window.DOMUtils.highlightWantedItems(wantedItemNames);
    }
    
    // update compare button state if notepad exists
    const compareBtn = listContainer?.querySelector('.dti-compare-btn');
    if (compareBtn) {
      compareBtn.classList.add(window.CSS_CLASSES.ACTIVE);
    }
  }
}

/**
 * toggle compare mode
 */
function toggleCompare() {
  if (window.location.hostname !== 'impress.openneo.net') {
    return;
  }

  const compareBtn = listContainer.querySelector('.dti-compare-btn');
  const hangersEl = document.querySelector(window.SELECTORS.CLOSET_HANGERS) ||
                   document.querySelector(window.SELECTORS.CLOSET_HANGERS_ALT) ||
                   document.querySelector('[id*="hanger"]') ||
                   document.querySelector('#hangers') ||
                   document.querySelector('.hangers') ||
                   document.body;

  if (hangersEl && compareBtn) {
    const isComparing = hangersEl.classList.contains('comparing');
    
    // toggle compare mode
    hangersEl.classList.toggle('comparing');
    compareBtn.classList.toggle(window.CSS_CLASSES.ACTIVE, !isComparing);
    
    // highlight wanted items when entering compare mode
    if (!isComparing) {
      const wantedItemNames = currentTradelist.receivingItems.map(item => item.name);
      window.DOMUtils.highlightWantedItems(wantedItemNames);
    }
  }
}

/**
 * add item to appropriate trade section
 * @param {string} itemName - item name
 * @param {string} sourceSection - source section (owned/wanted)
 */
function addToList(itemName, sourceSection = window.ITEM_SECTIONS.WANTED) {
  if (!window.validateItemName(itemName)) return;
  
  // determine which section to add to based on source
  const targetSection = sourceSection === window.ITEM_SECTIONS.OWNED ? 'receivingItems' : 'sendingItems';
  const targetList = currentTradelist[targetSection];

  if (!targetList.some(item => item.name === itemName)) {
    const autoValue = getAutoValue(itemName);
    const newItem = { 
      name: itemName, 
      value: autoValue,
      autoValue: autoValue,
      source: sourceSection
    };
    
    targetList.push(newItem);
    currentTradelist.lastModified = new Date().toISOString();
    saveData();
    updateListDisplay();
    
    // auto-open notepad when adding items
    if (isMinimized) {
      toggleNotepad();
    }
  }
}

/**
 * remove item from list
 * @param {string} section - section name
 * @param {number} index - item index
 */
function removeItem(section, index) {
  // map ui section names to data structure property names
  const sectionMap = {
    'receiving': 'receivingItems',
    'sending': 'sendingItems'
  };
  
  const targetList = currentTradelist[sectionMap[section]];
  
  if (targetList && targetList[index]) {
    targetList.splice(index, 1);
    currentTradelist.lastModified = new Date().toISOString();
    saveData();
    updateListDisplay();
  }
}

/**
 * update item value
 * @param {string} section - section name
 * @param {number} index - item index
 * @param {string} value - new value
 */
function updateItemValue(section, index, value) {
  // map ui section names to data structure property names
  const sectionMap = {
    'receiving': 'receivingItems',
    'sending': 'sendingItems'
  };
  
  const targetList = currentTradelist[sectionMap[section]];
  
  if (targetList && targetList[index]) {
    targetList[index].value = value;
    currentTradelist.lastModified = new Date().toISOString();
    saveData();
  }
}

/**
 * update header content with current context
 */
function updateHeaderContent() {
  const header = listContainer.querySelector('.dti-notepad-header');
  if (header) {
    const headerContent = generateHeaderContent();
    header.innerHTML = headerContent;
    attachHeaderEventListeners(header);
  }
}

/**
 * update list display
 */
function updateListDisplay() {
  const content = listContainer.querySelector('.dti-notepad-content');
  if (!content) return;

  // get current tradelist data
  const sendingItemsList = currentTradelist.sendingItems || [];
  const receivingItemsList = currentTradelist.receivingItems || [];

  // remember which tab was active before updating
  const activeTab = content.querySelector('.dti-tab-active')?.dataset.tab || 'receiving';

  // update header content
  updateHeaderContent();

  // calculate range totals for balance display
  const sendingRangeTotal = window.calculateRangeTotal(sendingItemsList);
  const receivingRangeTotal = window.calculateRangeTotal(receivingItemsList);

  // create tab data
  const tabs = [
    { name: 'receiving', label: 'RECEIVING', count: receivingItemsList.length },
    { name: 'sending', label: 'SENDING', count: sendingItemsList.length }
  ];

  const tabPanes = [
    {
      name: 'receiving',
      items: receivingItemsList,
      emptyMessage: 'Items you are RECEIVING'
    },
    {
      name: 'sending', 
      items: sendingItemsList,
      emptyMessage: 'Items you are SENDING'
    }
  ];

  // create tab navigation
  const tabNav = window.DOMUtils.createTabNavigation(tabs);
  
  // create tab content
  const tabContent = window.DOMUtils.createTabContent(tabPanes);

  // clear and rebuild content
  content.innerHTML = '';
  content.appendChild(tabNav);
  content.appendChild(tabContent);

  // format balance display text using ranges
  const sendingText = window.formatRangeDisplay(sendingRangeTotal);
  const receivingText = window.formatRangeDisplay(receivingRangeTotal);
  
  // update the balance bar at the bottom
  const balanceBar = listContainer.querySelector('.dti-balance-bar');
  if (balanceBar) {
    balanceBar.innerHTML = `
      <span class="dti-balance-offer">RECEIVING: ${receivingText}</span>
      <span class="dti-balance-offer">SENDING: ${sendingText}</span>
    `;
  }

  // add event listeners for value inputs
  content.querySelectorAll('.dti-item-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const section = e.target.dataset.section;
      const index = parseInt(e.target.dataset.index);
      updateItemValue(section, index, e.target.value);
      
      // update balance display in real time
      setTimeout(updateListDisplay, 100);
    });
  });

  // add event listeners for remove buttons
  content.querySelectorAll('.dti-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.target.dataset.section;
      const index = parseInt(e.target.dataset.index);
      removeItem(section, index);
    });
  });

  // add event listeners for tab switching
  content.querySelectorAll('.dti-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.target.dataset.tab;
      switchTab(targetTab);
    });
  });

  // restore the previously active tab
  if (activeTab !== 'receiving') {
    switchTab(activeTab);
  }
}

/**
 * switch between tabs
 * @param {string} tabName - tab name to switch to
 */
function switchTab(tabName) {
  const content = listContainer.querySelector('.dti-notepad-content');
  
  // update tab buttons
  content.querySelectorAll('.dti-tab').forEach(tab => {
    tab.classList.remove(window.CSS_CLASSES.TAB_ACTIVE);
    if (tab.dataset.tab === tabName) {
      tab.classList.add(window.CSS_CLASSES.TAB_ACTIVE);
    }
  });
  
  // update tab content
  content.querySelectorAll('.dti-tab-pane').forEach(pane => {
    pane.classList.remove(window.CSS_CLASSES.TAB_PANE_ACTIVE);
    if (pane.dataset.tabContent === tabName) {
      pane.classList.add(window.CSS_CLASSES.TAB_PANE_ACTIVE);
    }
  });
}

/**
 * generate tradelist text for neomail
 * @returns {string} formatted tradelist text
 */
function generateTradelistText() {
  const sendingItemsList = currentTradelist.sendingItems || [];
  const receivingItemsList = currentTradelist.receivingItems || [];
  
  const totalItems = sendingItemsList.length + receivingItemsList.length;
  if (totalItems === 0) return '';

  let text = '';
  
  if (sendingItemsList.length > 0) {
    text += 'SENDING:\n';
    text += sendingItemsList.map(item => `- ${item.name} (${item.value || 'no value'})`).join('\n');
  }
  
  if (receivingItemsList.length > 0) {
    if (text) text += '\n\n';
    text += 'RECEIVING:\n';
    text += receivingItemsList.map(item => `- ${item.name} (${item.value || 'no value'})`).join('\n');
  }
  
  return text;
}

/**
 * generate enhanced neomail message text
 * @param {string} recipientUsername - recipient username
 * @returns {string} formatted neomail text
 */
function generateNeomailText(recipientUsername) {
  const sendingItemsList = currentTradelist.sendingItems || [];
  const receivingItemsList = currentTradelist.receivingItems || [];
  
  const totalItems = sendingItemsList.length + receivingItemsList.length;
  if (totalItems === 0) return '';

  let text = `Hi ${recipientUsername}!\n\nWould you be interested in trading the following:\n\n`;
  
  if (receivingItemsList.length > 0) {
    text += 'RECEIVING (what I\'m looking for from you):\n';
    text += receivingItemsList.map(item => `- ${item.name} (${item.value || 'no value'})`).join('\n');
  }
  
  if (sendingItemsList.length > 0) {
    if (receivingItemsList.length > 0) text += '\n\n';
    text += 'OFFERING (what I can send to you):\n';
    text += sendingItemsList.map(item => `- ${item.name} (${item.value || 'no value'})`).join('\n');
  }
  
  text += '\n\nLet me know if you\'re interested!\n\nThanks!';
  
  return text;
}

/**
 * generate neomail url with pre-populated message
 * @param {string} username - recipient username
 * @returns {string|null} neomail url or null
 */
function generateNeomailUrl(username) {
  const message = generateNeomailText(username);
  if (!message) return null;
  
  const encodedMessage = encodeURIComponent(message);
  const encodedSubject = encodeURIComponent('Trading Inquiry');
  
  return `http://www.neopets.com/neomessages.phtml?type=send&recipient=${encodeURIComponent(username)}&subject=${encodedSubject}&message_body=${encodedMessage}`;
}

/**
 * check if neomail is available on the current page
 * @returns {boolean} true if neomail is available
 */
function isNeomailAvailable() {
  const neomailLinkEl = document.querySelector(window.SELECTORS.NEOMAIL_LINK);
  return !!neomailLinkEl;
}

/**
 * generate header content with conditional user links
 * @returns {string} header html content
 */
function generateHeaderContent() {
  const totalItems = (currentTradelist.sendingItems?.length || 0) + (currentTradelist.receivingItems?.length || 0);
  
  // base title and controls
  let titleText = `Working List (<span class="dti-item-count">${totalItems}</span>)`;
  
  // add username context if we're on dti and have detected a user
  if (currentUsername && window.location.hostname === 'impress.openneo.net') {
    titleText = `Working List - ${window.escapeHtml(currentUsername)} (<span class="dti-item-count">${totalItems}</span>)`;
  }
  
  let headerHTML = `
    <div style="display: flex !important; flex-direction: column !important; gap: 4px !important;">
      <div style="display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <span class="dti-notepad-title" style="font-weight: 600 !important; color: #000000 !important; font-size: 14px !important;">${titleText}</span>
        <div class="dti-notepad-controls" style="display: flex !important; gap: 2px !important;">
          <button class="dti-notepad-btn dti-save-btn" title="Save List">
            <svg fill="#000000" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17,3H5A2,2,0,0,0,3,5V19a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V7L17,3ZM12,19A3,3,0,1,1,15,16,3,3,0,0,1,12,19Zm3-8H6V6h9Z"/>
            </svg>
          </button>
          <button class="dti-notepad-btn dti-load-btn" title="Load List">
            <svg fill="#000000" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8ZM18,20H6V4h7V9h5Z"/>
            </svg>
          </button>
          <button class="dti-notepad-btn dti-refresh-btn" title="Refresh Values">
            <svg fill="#000000" width="16px" height="16px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.707,10.293a1,1,0,0,1,0,1.414l-2,2a1,1,0,0,1-1.414,0l-2-2a1,1,0,0,1,1.414-1.414l.108.108a6.972,6.972,0,0,0-2.44-3.866,1,1,0,1,1,1.25-1.56,8.946,8.946,0,0,1,3.269,5.717l.4-.4A1,1,0,0,1,22.707,10.293ZM4.975,6.375a1,1,0,1,0,1.56,1.25A6.972,6.972,0,0,1,10.4,5.185l-.108.108a1,1,0,1,0,1.414,1.414l2-2a1,1,0,0,0,0-1.414l-2-2a1,1,0,0,0-1.414,1.414l.4.4A8.946,8.946,0,0,0,4.975,6.375Zm12.49,10a6.972,6.972,0,0,1-3.866,2.44l.108-.108a1,1,0,0,0-1.414-1.414l-2,2a1,1,0,0,0,0,1.414l2,2a1,1,0,0,0,1.414-1.414l-.4-.4a8.946,8.946,0,0,0,5.717-3.269,1,1,0,1,0-1.56-1.25ZM6.374,19.025a1,1,0,1,0,1.251-1.56A6.972,6.972,0,0,1,5.185,13.6l.108.108a1,1,0,1,0,1.414-1.414l-2-2a1,1,0,0,0-1.414,0l-2,2a1,1,0,0,0,1.414,1.414l.4-.4A8.949,8.949,0,0,0,6.374,19.025Z"/>
            </svg>
          </button>
          <button class="dti-notepad-btn dti-compare-btn" title="Compare">
            <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M1,8A1,1,0,0,1,2,7H9.586L7.293,4.707A1,1,0,1,1,8.707,3.293l4,4a1,1,0,0,1,0,1.414l-4,4a1,1,0,1,1-1.414-1.414L9.586,9H2A1,1,0,0,1,1,8Zm21,7H14.414l2.293-2.293a1,1,0,0,0-1.414-1.414l-4,4a1,1,0,0,0,0,1.414l4,4a1,1,0,0,0,1.414-1.414L14.414,17H22a1,1,0,0,0,0-2Z"/>
            </svg>
          </button>
          <button class="dti-notepad-btn dti-copy-all-btn" title="Copy All">
            <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M21,8H9A1,1,0,0,0,8,9V21a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V9A1,1,0,0,0,21,8ZM20,20H10V10H20ZM6,15a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V3A1,1,0,0,1,3,2H15a1,1,0,0,1,1,1V5a1,1,0,0,1-2,0V4H4V14H5A1,1,0,0,1,6,15Z"/>
            </svg>
          </button>
          <button class="dti-notepad-btn dti-clear-btn" title="Clear">
            <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M7,18V14a1,1,0,0,1,2,0v4a1,1,0,0,1-2,0Zm5,1a1,1,0,0,0,1-1V14a1,1,0,0,0-2,0v4A1,1,0,0,0,12,19Zm4,0a1,1,0,0,0,1-1V14a1,1,0,0,0-2,0v4A1,1,0,0,0,16,19ZM23,6v4a1,1,0,0,1-1,1H21V22a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V11H2a1,1,0,0,1-1-1V6A1,1,0,0,1,2,5H7V2A1,1,0,0,1,8,1h8a1,1,0,0,1,1,1V5h5A1,1,0,0,1,23,6ZM9,5h6V3H9Zm10,6H5V21H19Zm2-4H3V9H21Z"/>
            </svg>
          </button>
        </div>
      </div>`;
  
  // add user links row if we're on dti and have detected a user
  if (currentUsername && window.location.hostname === 'impress.openneo.net' && totalItems > 0) {
    const neomailUrl = generateNeomailUrl(currentUsername);
    const neomailAvailable = isNeomailAvailable();
    
    // style for disabled/grayed out links
    const disabledStyle = `color: #999999 !important; text-decoration: none !important; padding: 2px 6px !important; border: 1px solid #cccccc !important; border-radius: 3px !important; background: #f5f5f5 !important; cursor: not-allowed !important;`;
    const enabledStyle = `color: #007bff !important; text-decoration: none !important; padding: 2px 6px !important; border: 1px solid #007bff !important; border-radius: 3px !important; background: #f8f9fa !important;`;
    
    headerHTML += `
      <div class="dti-user-links" style="display: flex !important; gap: 8px !important; font-size: 11px !important;">`;
    
    // neomail link - gray out if not available or no url generated
    if (neomailUrl && neomailAvailable) {
      headerHTML += `<a href="${neomailUrl}" target="_blank" style="${enabledStyle}">📧 Neomail ${window.escapeHtml(currentUsername)}</a>`;
    } else {
      const title = neomailAvailable ? 'No items to send' : 'Neomail not available for this user';
      headerHTML += `<span style="${disabledStyle}" title="${title}">📧 Neomail ${window.escapeHtml(currentUsername)}</span>`;
    }
    
    headerHTML += `</div>`;
  }
  
  headerHTML += `</div>`;
  
  return headerHTML;
}

/**
 * copy all items
 */
async function copyAllItems() {
  const text = generateTradelistText();
  if (!text) return;

  try {
    await window.copyToClipboard(text);
    
    // visual feedback for success
    const copyBtn = listContainer.querySelector('.dti-copy-all-btn');
    if (copyBtn) {
      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓';
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 1000);
    }
  } catch (error) {
    console.error('DTI Trading Assistant: Failed to copy all items:', error);
    showStatusMessage('Failed to copy to clipboard. Please try again.', 'error');
  }
}

/**
 * clear list
 */
function clearList() {
  const totalItems = currentTradelist.sendingItems.length + currentTradelist.receivingItems.length;
  if (totalItems === 0) return;
  
  if (confirm('Clear all items from working list?')) {
    currentTradelist.sendingItems = [];
    currentTradelist.receivingItems = [];
    currentTradelist.notes = '';
    currentTradelist.lastModified = new Date().toISOString();
    
    saveData();
    updateListDisplay();
  }
}

/**
 * refresh values from lebron values api via background script
 */
function refreshValues() {
  const refreshBtn = listContainer.querySelector('.dti-refresh-btn');
  if (refreshBtn) {
    refreshBtn.classList.add('dti-loading');
    refreshBtn.disabled = true;
  }

  console.log('DTI Trading Assistant: Requesting values from background script...');
  
  // send message to background script to fetch values
  browser.runtime.sendMessage({ action: 'fetchLebronValues' })
    .then(response => {
      if (response.success) {
        console.log('DTI Trading Assistant: Values received from background script');
        
        // update local neopetsValues with the fetched data
        neopetsValues = response.values;
        
        console.log('DTI Trading Assistant: Updated neopetsValues with', Object.keys(neopetsValues).length, 'items');
        
        // update existing items in current tradelist with new values
        updateExistingItemValues();
        
        // save the updated tradelist data
        saveData().then(() => {
          // refresh the display
          updateListDisplay();
          
          // show success message
          showStatusMessage(window.SUCCESS_MESSAGES.VALUES_REFRESHED, 'success');
          
          console.log('DTI Trading Assistant: Values refresh completed successfully');
        }).catch(error => {
          console.error('DTI Trading Assistant: Error saving after refresh:', error);
          showStatusMessage('Values refreshed, but failed to save changes.', 'warning');
        });
      } else {
        throw new Error(response.error || 'Unknown error from background script');
      }
    })
    .catch(error => {
      console.error('DTI Trading Assistant: Error fetching values:', error);
      
      // show user-friendly error message based on error type
      let errorMessage = window.ERROR_MESSAGES.VALUES_FETCH_FAILED;
      if (error.message && error.message.includes('QuotaExceededError')) {
        errorMessage = window.ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED;
      }
      
      showStatusMessage(errorMessage, 'error');
    })
    .finally(() => {
      // always re-enable the button
      if (refreshBtn) {
        refreshBtn.classList.remove('dti-loading');
        refreshBtn.disabled = false;
      }
    });
}

/**
 * update existing items with new values from api
 */
function updateExistingItemValues() {
  const sendingItemsList = currentTradelist.sendingItems || [];
  const receivingItemsList = currentTradelist.receivingItems || [];
  
  let updatedCount = 0;
  
  // update items in both sections
  [...sendingItemsList, ...receivingItemsList].forEach(item => {
    const newAutoValue = getAutoValue(item.name);
    if (newAutoValue && newAutoValue !== item.autoValue) {
      // update auto value and current value if it was auto-populated
      const wasAutoPopulated = item.autoValue && item.value === item.autoValue;
      item.autoValue = newAutoValue;
      if (wasAutoPopulated || !item.value) {
        item.value = newAutoValue;
      }
      updatedCount++;
    }
  });
  
  if (updatedCount > 0) {
    currentTradelist.lastModified = new Date().toISOString();
    console.log(`DTI Trading Assistant: Updated ${updatedCount} items with new values`);
  }
}

/**
 * show status message in notepad
 * @param {string} message - message text
 * @param {string} type - message type
 */
function showStatusMessage(message, type = 'info') {
  const content = listContainer?.querySelector('.dti-notepad-content');
  if (!content) return;
  
  window.DOMUtils.showStatusMessage(content, message, type);
}

/**
 * show save dialog
 */
function showSaveDialog() {
  const totalItems = currentTradelist.sendingItems.length + currentTradelist.receivingItems.length;
  if (totalItems === 0) {
    showStatusMessage('No items to save!', 'warning');
    return;
  }

  // generate smart default name based on current context
  let defaultName = 'My Tradelist';
  if (currentUsername && window.location.hostname === 'impress.openneo.net') {
    defaultName = `Trade with ${currentUsername}`;
  }

  // create modal overlay and dialog
  const overlay = window.DOMUtils.createModalOverlay();
  const modalContent = `
    <h3 style="margin: 0 0 16px 0 !important; font-size: 18px !important; font-weight: 600 !important; color: #000000 !important;">Save Tradelist</h3>
    <div style="margin-bottom: 16px !important;">
      <label style="display: block !important; margin-bottom: 8px !important; font-weight: 500 !important; color: #333333 !important;">List Name:</label>
      <input type="text" class="dti-save-name-input" value="${window.escapeHtml(defaultName)}" style="
        width: 100% !important;
        padding: 8px 12px !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        font-size: 14px !important;
        font-family: Inter, sans-serif !important;
        box-sizing: border-box !important;
      ">
    </div>
    <div style="margin-bottom: 20px !important;">
      <label style="display: block !important; margin-bottom: 8px !important; font-weight: 500 !important; color: #333333 !important;">
        <input type="checkbox" class="dti-save-clear-checkbox" style="margin-right: 8px !important;">
        Clear working list after saving
      </label>
    </div>
    <div style="display: flex !important; gap: 8px !important; justify-content: flex-end !important;">
      <button class="dti-modal-btn dti-cancel-btn" style="
        padding: 8px 16px !important;
        border: 1px solid #ddd !important;
        background: #ffffff !important;
        color: #666666 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-family: Inter, sans-serif !important;
        font-size: 14px !important;
      ">Cancel</button>
      <button class="dti-modal-btn dti-save-confirm-btn" style="
        padding: 8px 16px !important;
        border: none !important;
        background: #007bff !important;
        color: #ffffff !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-family: Inter, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
      ">Save</button>
    </div>
  `;

  const modal = window.DOMUtils.createModal('dti-save-modal', modalContent);
  modal.style.cssText = `
    background: #ffffff !important;
    border-radius: 8px !important;
    padding: 24px !important;
    width: 400px !important;
    max-width: 90vw !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    font-family: Inter, sans-serif !important;
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // focus the name input and select all text
  const nameInput = modal.querySelector('.dti-save-name-input');
  nameInput.focus();
  nameInput.select();

  // event listeners
  modal.querySelector('.dti-cancel-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  modal.querySelector('.dti-save-confirm-btn').addEventListener('click', () => {
    const name = nameInput.value.trim();
    const shouldClear = modal.querySelector('.dti-save-clear-checkbox').checked;
    
    if (!name) {
      showStatusMessage('Please enter a name for the tradelist.', 'error');
      return;
    }

    // check for duplicate names
    if (savedTradelists[name]) {
      if (!confirm(`A tradelist named "${name}" already exists. Do you want to overwrite it?`)) {
        return;
      }
    }

    // save the tradelist
    const currentDate = new Date().toISOString();
    savedTradelists[name] = {
      sendingItems: [...currentTradelist.sendingItems],
      receivingItems: [...currentTradelist.receivingItems],
      notes: currentTradelist.notes || '',
      dateCreated: savedTradelists[name]?.dateCreated || currentDate,
      dateModified: currentDate
    };

    // clear working list if requested
    if (shouldClear) {
      currentTradelist.sendingItems = [];
      currentTradelist.receivingItems = [];
      currentTradelist.notes = '';
      currentTradelist.lastModified = new Date().toISOString();
      updateListDisplay();
    }

    // save to storage
    saveData().then(() => {
      showStatusMessage(`Tradelist "${name}" saved successfully!`, 'success');
      document.body.removeChild(overlay);
    }).catch(error => {
      console.error('DTI Trading Assistant: Error saving tradelist:', error);
      showStatusMessage('Failed to save tradelist. Please try again.', 'error');
    });
  });

  // close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // save on enter key
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      modal.querySelector('.dti-save-confirm-btn').click();
    }
  });
}

/**
 * show load dialog
 */
function showLoadDialog() {
  const savedNames = Object.keys(savedTradelists);
  if (savedNames.length === 0) {
    showStatusMessage('No saved tradelists found.', 'info');
    return;
  }

  // create modal overlay
  const overlay = window.DOMUtils.createModalOverlay();

  // sort saved tradelists by date modified (most recent first)
  const sortedNames = savedNames.sort((a, b) => {
    const dateA = savedTradelists[a].dateModified || savedTradelists[a].dateCreated || 0;
    const dateB = savedTradelists[b].dateModified || savedTradelists[b].dateCreated || 0;
    return new Date(dateB) - new Date(dateA);
  });

  // generate tradelist items html
  const tradelistsHTML = sortedNames.map(name => {
    const tradelist = savedTradelists[name];
    const totalItems = (tradelist.sendingItems?.length || 0) + (tradelist.receivingItems?.length || 0);
    const dateModified = new Date(tradelist.dateModified || tradelist.dateCreated);
    const timeAgo = window.getRelativeTime(dateModified);
    
    return `
      <div class="dti-load-item" data-name="${window.escapeHtml(name)}" style="
        padding: 12px !important;
        border: 1px solid #eee !important;
        border-radius: 4px !important;
        margin-bottom: 8px !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
      ">
        <div style="display: flex !important; justify-content: space-between !important; align-items: center !important;">
          <div>
            <div style="font-weight: 500 !important; color: #000000 !important; margin-bottom: 4px !important;">${window.escapeHtml(name)}</div>
            <div style="font-size: 12px !important; color: #666666 !important;">${totalItems} items • ${timeAgo}</div>
          </div>
          <button class="dti-delete-tradelist-btn" data-name="${window.escapeHtml(name)}" style="
            background: #dc3545 !important;
            color: white !important;
            border: none !important;
            border-radius: 3px !important;
            padding: 4px 8px !important;
            font-size: 12px !important;
            cursor: pointer !important;
            font-family: Inter, sans-serif !important;
          ">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  const modalContent = `
    <h3 style="margin: 0 0 16px 0 !important; font-size: 18px !important; font-weight: 600 !important; color: #000000 !important;">Load Tradelist</h3>
    <div style="margin-bottom: 16px !important;">
      <label style="display: block !important; margin-bottom: 8px !important; font-weight: 500 !important; color: #333333 !important;">
        <input type="radio" name="loadMode" value="replace" checked style="margin-right: 8px !important;">
        Replace current working list
      </label>
      <label style="display: block !important; margin-bottom: 8px !important; font-weight: 500 !important; color: #333333 !important;">
        <input type="radio" name="loadMode" value="merge" style="margin-right: 8px !important;">
        Merge with current working list
      </label>
    </div>
    <div style="flex: 1 !important; overflow-y: auto !important; margin-bottom: 16px !important; max-height: 300px !important;">
      ${tradelistsHTML}
    </div>
    <div style="display: flex !important; gap: 8px !important; justify-content: flex-end !important;">
      <button class="dti-modal-btn dti-cancel-btn" style="
        padding: 8px 16px !important;
        border: 1px solid #ddd !important;
        background: #ffffff !important;
        color: #666666 !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-family: Inter, sans-serif !important;
        font-size: 14px !important;
      ">Cancel</button>
    </div>
  `;

  const modal = window.DOMUtils.createModal('dti-load-modal', modalContent);
  modal.style.cssText = `
    background: #ffffff !important;
    border-radius: 8px !important;
    padding: 24px !important;
    width: 500px !important;
    max-width: 90vw !important;
    max-height: 80vh !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    font-family: Inter, sans-serif !important;
    display: flex !important;
    flex-direction: column !important;
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // add hover effects to load items
  modal.querySelectorAll('.dti-load-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f8f9fa';
    });
    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = '';
    });
  });

  // event listeners for load items
  modal.querySelectorAll('.dti-load-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // don't trigger if delete button was clicked
      if (e.target.classList.contains('dti-delete-tradelist-btn')) return;
      
      const name = item.dataset.name;
      const loadMode = modal.querySelector('input[name="loadMode"]:checked').value;
      loadTradelist(name, loadMode);
      document.body.removeChild(overlay);
    });
  });

  // event listeners for delete buttons
  modal.querySelectorAll('.dti-delete-tradelist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.name;
      
      if (confirm(`Are you sure you want to delete "${name}"?`)) {
        delete savedTradelists[name];
        saveData().then(() => {
          showStatusMessage(`Tradelist "${name}" deleted.`, 'success');
          // refresh the dialog
          document.body.removeChild(overlay);
          showLoadDialog();
        }).catch(error => {
          console.error('DTI Trading Assistant: Error deleting tradelist:', error);
          showStatusMessage('Failed to delete tradelist.', 'error');
        });
      }
    });
  });

  // event listeners for modal
  modal.querySelector('.dti-cancel-btn').addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  // close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

/**
 * load a saved tradelist
 * @param {string} name - tradelist name
 * @param {string} mode - load mode (replace/merge)
 */
function loadTradelist(name, mode = 'replace') {
  const tradelist = savedTradelists[name];
  if (!tradelist) {
    showStatusMessage(`Tradelist "${name}" not found.`, 'error');
    return;
  }

  if (mode === 'replace') {
    // replace current working list
    currentTradelist.sendingItems = [...(tradelist.sendingItems || [])];
    currentTradelist.receivingItems = [...(tradelist.receivingItems || [])];
    currentTradelist.notes = tradelist.notes || '';
  } else if (mode === 'merge') {
    // merge with current working list (avoid duplicates)
    const existingSendingNames = new Set(currentTradelist.sendingItems.map(item => item.name));
    const existingReceivingNames = new Set(currentTradelist.receivingItems.map(item => item.name));
    
    // add items that don't already exist
    (tradelist.sendingItems || []).forEach(item => {
      if (!existingSendingNames.has(item.name)) {
        currentTradelist.sendingItems.push({...item});
      }
    });
    
    (tradelist.receivingItems || []).forEach(item => {
      if (!existingReceivingNames.has(item.name)) {
        currentTradelist.receivingItems.push({...item});
      }
    });
  }

  currentTradelist.lastModified = new Date().toISOString();
  
  saveData().then(() => {
    updateListDisplay();
    const action = mode === 'replace' ? 'loaded' : 'merged';
    showStatusMessage(`Tradelist "${name}" ${action} successfully!`, 'success');
  }).catch(error => {
    console.error('DTI Trading Assistant: Error loading tradelist:', error);
    showStatusMessage('Failed to load tradelist.', 'error');
  });
}

/**
 * add buttons to objects that don't have them
 */
function addButtons() {
  window.DOMUtils.addButtonsToObjects(handleCopyClick, handleAddClick);
}

/**
 * check for url changes and new content periodically
 */
function checkForUpdates() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    
    // update username detection when url changes
    const newUsername = window.DOMUtils.getUsername();
    if (newUsername !== currentUsername) {
      currentUsername = newUsername;
      console.log('DTI Trading Assistant: Username updated to:', currentUsername);
      
      // update header if notepad exists
      if (listContainer) {
        updateHeaderContent();
      }
    }
    
    setTimeout(addButtons, window.TIMING.BUTTON_ADD_DELAY);
  } else {
    addButtons();
  }
}

/**
 * initialize function
 */
async function initializeExtension() {
  console.log('DTI Trading Assistant: Starting initialization...');

  // check if extension should show on this site
  if (!shouldShowExtension()) {
    console.log('DTI Trading Assistant: Extension disabled for site:', window.location.hostname);
    return;
  }

  console.log('DTI Trading Assistant: Extension enabled for site:', window.location.hostname);
  currentUsername = window.DOMUtils.getUsername();
  
  try {
    const settings = await loadData();
    console.log('DTI Trading Assistant: Data loaded, currentTradelist:', currentTradelist, 'savedTradelists:', savedTradelists);
    
    // check site-specific settings from storage
    const siteSettings = settings.siteSettings || {};
    const hostname = window.location.hostname.toLowerCase();
    const siteEnabled = siteSettings[hostname] !== false; // default to enabled
    
    if (!siteEnabled) {
      console.log('DTI Trading Assistant: Extension disabled by user setting for site:', hostname);
      return;
    }
    
    addButtons();
    
    // check if notepad should be shown (default to true if not set)
    const showNotepad = settings.showNotepad !== false;
    
    if (showNotepad) {
      console.log('DTI Trading Assistant: Creating toggle button...');
      createToggleButton();
      console.log('DTI Trading Assistant: Creating notepad...');
      createNotepad();
    } else {
      console.log('DTI Trading Assistant: Notepad disabled by user setting');
    }
    
    // apply auto-compare setting if enabled and on DTI
    if (settings.autoCompare && window.location.hostname === 'impress.openneo.net') {
      console.log('DTI Trading Assistant: Auto-compare enabled, applying...');
      setTimeout(() => {
        applyAutoCompare();
      }, 1000); // delay to ensure page is loaded
    }
    
    console.log('DTI Trading Assistant: Initialization complete');
  } catch (error) {
    console.error('DTI Trading Assistant: Initialization error:', error);
  }
}

// start initialization
initializeExtension();

// check periodically for new content
setInterval(checkForUpdates, window.TIMING.UPDATE_CHECK_INTERVAL);

// also check when focus returns to window
window.addEventListener('focus', () => {
  setTimeout(addButtons, window.TIMING.FOCUS_DELAY);
});

// listen for dom changes (for dynamic content)
const observer = new MutationObserver(window.debounce((mutations) => {
  let shouldUpdate = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      shouldUpdate = true;
    }
  });
  
  if (shouldUpdate) {
    setTimeout(addButtons, window.TIMING.MUTATION_DELAY);
  }
}, window.TIMING.DEBOUNCE_DELAY));

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// save data when page unloads
window.addEventListener('beforeunload', saveData);

// listen for messages from popup about setting changes
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'settingChanged') {
    handleSettingChange(message.data);
  } else if (message.action === 'siteSettingChanged') {
    handleSiteSettingChange(message.data);
  }
});

/**
 * handle setting changes from popup
 * @param {Object} data - setting change data
 */
function handleSettingChange(data) {
  console.log('DTI Trading Assistant: Received setting change:', data);
  
  if (data.hasOwnProperty('autoCompare')) {
    if (data.autoCompare && window.location.hostname === 'impress.openneo.net') {
      console.log('DTI Trading Assistant: Enabling auto-compare');
      setTimeout(() => {
        applyAutoCompare();
      }, 100);
    } else if (!data.autoCompare && window.location.hostname === 'impress.openneo.net') {
      console.log('DTI Trading Assistant: Disabling auto-compare');
      const hangersEl = document.querySelector(window.SELECTORS.CLOSET_HANGERS) ||
                       document.querySelector(window.SELECTORS.CLOSET_HANGERS_ALT) ||
                       document.querySelector('[id*="hanger"]') ||
                       document.querySelector('#hangers') ||
                       document.querySelector('.hangers') ||
                       document.body;
      
      if (hangersEl) {
        hangersEl.classList.remove('comparing');
      }
      
      const compareBtn = listContainer?.querySelector('.dti-compare-btn');
      if (compareBtn) {
        compareBtn.classList.remove(window.CSS_CLASSES.ACTIVE);
      }
    }
  }
  
  if (data.hasOwnProperty('showNotepad')) {
    if (data.showNotepad && !listContainer) {
      console.log('DTI Trading Assistant: Enabling notepad');
      createToggleButton();
      createNotepad();
    } else if (!data.showNotepad && listContainer) {
      console.log('DTI Trading Assistant: Disabling notepad');
      if (listContainer) {
        listContainer.remove();
        listContainer = null;
      }
      if (toggleButton) {
        toggleButton.remove();
        toggleButton = null;
      }
    }
  }
}

/**
 * handle site setting changes from popup
 * @param {Object} data - site setting change data
 */
function handleSiteSettingChange(data) {
  console.log('DTI Trading Assistant: Received site setting change:', data);
  
  const currentHostname = window.location.hostname.toLowerCase();
  if (data.hostname === currentHostname) {
    if (!data.enabled) {
      console.log('DTI Trading Assistant: Extension disabled for current site, hiding UI');
      // hide extension UI
      if (listContainer) {
        listContainer.style.display = 'none';
      }
      if (toggleButton) {
        toggleButton.style.display = 'none';
      }
    } else {
      console.log('DTI Trading Assistant: Extension enabled for current site, showing UI');
      // show extension UI
      if (listContainer) {
        listContainer.style.display = '';
      }
      if (toggleButton) {
        toggleButton.style.display = '';
      }
    }
  }
}
