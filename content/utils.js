// DTI Trading Assistant - Utility Functions

/**
 * escape html to prevent xss attacks
 * @param {string} text - text to escape
 * @returns {string} escaped html
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * copy text to clipboard using modern api
 * @param {string} text - text to copy
 * @returns {Promise<void>}
 */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied to clipboard:', text);
  } catch (err) {
    console.error('Failed to copy text:', err);
    throw err;
  }
}

/**
 * parse item value, handling ranges like "1-2" or "3-4"
 * @param {string} valueString - value string to parse
 * @returns {number} parsed numeric value (average for ranges)
 */
function parseItemValue(valueString) {
  if (!valueString || typeof valueString !== 'string') return 0;
  
  const trimmed = valueString.trim();
  if (!trimmed) return 0;
  
  // check for range pattern like "1-2" or "3-4"
  const rangeMatch = trimmed.match(window.REGEX.VALUE_RANGE);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    // use average of range for balance calculation
    return (min + max) / 2;
  }
  
  // fallback to regular parseFloat for single values
  return parseFloat(trimmed) || 0;
}

/**
 * calculate total range for a list of items
 * @param {Array} itemsList - list of items with value properties
 * @returns {Object} object with min and max totals
 */
function calculateRangeTotal(itemsList) {
  let minTotal = 0;
  let maxTotal = 0;
  
  itemsList.forEach(item => {
    if (!item.value || typeof item.value !== 'string') return;
    
    const trimmed = item.value.trim();
    if (!trimmed) return;
    
    // check for range pattern like "1-2" or "3-4"
    const rangeMatch = trimmed.match(window.REGEX.VALUE_RANGE);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      minTotal += min;
      maxTotal += max;
    } else {
      // single value - add to both min and max
      const value = parseFloat(trimmed) || 0;
      minTotal += value;
      maxTotal += value;
    }
  });
  
  return { min: minTotal, max: maxTotal };
}

/**
 * format range display for balance bar
 * @param {Object} rangeTotal - object with min and max properties
 * @returns {string} formatted display string
 */
function formatRangeDisplay(rangeTotal) {
  const { min, max } = rangeTotal;
  
  if (min === 0 && max === 0) return '0 OWLs';
  if (min === max) return `${min} OWLs`;
  return `${min}-${max} OWLs`;
}

/**
 * get relative time string (e.g., "2 hours ago")
 * @param {Date|string} date - date to compare
 * @returns {string} relative time string
 */
function getRelativeTime(date) {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now - targetDate;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  
  return targetDate.toLocaleDateString();
}

/**
 * debounce function calls
 * @param {Function} func - function to debounce
 * @param {number} wait - wait time in milliseconds
 * @returns {Function} debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * create a delay promise
 * @param {number} ms - milliseconds to delay
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * show visual feedback on button
 * @param {HTMLElement} button - button element
 * @param {string} feedbackText - text to show
 * @param {number} duration - duration in milliseconds
 */
function showButtonFeedback(button, feedbackText = '✓', duration = window.TIMING.BUTTON_FEEDBACK_DURATION) {
  const originalHTML = button.innerHTML;
  button.innerHTML = feedbackText;
  setTimeout(() => {
    button.innerHTML = originalHTML;
  }, duration);
}

/**
 * validate item name
 * @param {string} name - item name to validate
 * @returns {boolean} true if valid, false if invalid
 */
function validateItemName(name) {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmed = name.trim();
  if (!trimmed) {
    return false;
  }
  
  // check for reasonable length (1-200 characters)
  if (trimmed.length > 200) {
    return false;
  }
  
  // basic validation - no control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * validate tradelist name
 * @param {string} name - name to validate
 * @returns {Object} validation result with isValid and error properties
 */
function validateTradelistName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required' };
  }
  
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Name cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { isValid: false, error: 'Name is too long (max 100 characters)' };
  }
  
  return { isValid: true, error: null };
}

/**
 * generate smart default tradelist name based on context
 * @param {string} username - current username if available
 * @param {string} hostname - current hostname
 * @returns {string} default name
 */
function generateDefaultTradelistName(username, hostname) {
  if (username && hostname === 'impress.openneo.net') {
    return `Trade with ${username}`;
  }
  return 'My Tradelist';
}

/**
 * check if a hostname matches supported sites
 * @param {string} hostname - hostname to check
 * @param {Object} supportedSites - supported sites configuration
 * @returns {boolean} true if supported
 */
function isSiteSupported(hostname, supportedSites) {
  const lowerHostname = hostname.toLowerCase();
  
  // direct match
  if (supportedSites[lowerHostname]) {
    return true;
  }
  
  // partial match (subdomain support)
  for (const site in supportedSites) {
    if (lowerHostname.includes(site) || site.includes(lowerHostname)) {
      return true;
    }
  }
  
  return false;
}

/**
 * create status message element
 * @param {string} message - message text
 * @param {string} type - message type (success, error, warning, info)
 * @returns {HTMLElement} message element
 */
function createStatusMessage(message, type = window.MESSAGE_TYPES.INFO) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `dti-status-message ${type}`;
  messageDiv.textContent = message;
  return messageDiv;
}

/**
 * remove existing status messages from container
 * @param {HTMLElement} container - container element
 */
function clearStatusMessages(container) {
  const existingMessages = container.querySelectorAll('.dti-status-message');
  existingMessages.forEach(msg => msg.remove());
}

/**
 * safely get nested object property
 * @param {Object} obj - object to traverse
 * @param {string} path - dot-separated path
 * @param {*} defaultValue - default value if path not found
 * @returns {*} property value or default
 */
function safeGet(obj, path, defaultValue = null) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * safely set nested object property
 * @param {Object} obj - object to modify
 * @param {string} path - dot-separated path
 * @param {*} value - value to set
 */
function safeSet(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * create element with attributes and content
 * @param {string} tag - html tag name
 * @param {Object} attributes - attributes to set
 * @param {string|HTMLElement|Array} content - content to append
 * @returns {HTMLElement} created element
 */
function createElement(tag, attributes = {}, content = null) {
  const element = document.createElement(tag);
  
  // set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // add content
  if (content !== null) {
    if (typeof content === 'string') {
      element.textContent = content;
    } else if (content instanceof HTMLElement) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
        } else if (child instanceof HTMLElement) {
          element.appendChild(child);
        }
      });
    }
  }
  
  return element;
}

/**
 * add event listener with automatic cleanup
 * @param {HTMLElement} element - element to attach listener to
 * @param {string} event - event type
 * @param {Function} handler - event handler
 * @param {Object} options - event listener options
 * @returns {Function} cleanup function
 */
function addEventListenerWithCleanup(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * batch dom updates to improve performance
 * @param {Function} updateFunction - function that performs dom updates
 */
function batchDOMUpdates(updateFunction) {
  requestAnimationFrame(() => {
    updateFunction();
  });
}

/**
 * copy text to clipboard with fallback methods
 * @param {string} text - text to copy
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  try {
    // try modern clipboard api first
    await copyText(text);
  } catch (err) {
    console.warn('Modern clipboard API failed, trying fallback:', err);
    
    // fallback to execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('execCommand copy failed');
      }
      
      console.log('Copied to clipboard using fallback:', text);
    } catch (fallbackErr) {
      console.error('All clipboard methods failed:', fallbackErr);
      throw new Error('Failed to copy to clipboard');
    }
  }
}

// Expose utility functions to global scope for use across content scripts
window.escapeHtml = escapeHtml;
window.debounce = debounce;
window.copyText = copyText;
window.copyToClipboard = copyToClipboard;
window.parseItemValue = parseItemValue;
window.calculateRangeTotal = calculateRangeTotal;
window.formatRangeDisplay = formatRangeDisplay;
window.getRelativeTime = getRelativeTime;
window.delay = delay;
window.showButtonFeedback = showButtonFeedback;
window.validateItemName = validateItemName;
window.validateTradelistName = validateTradelistName;
window.generateDefaultTradelistName = generateDefaultTradelistName;
window.isSiteSupported = isSiteSupported;
window.createStatusMessage = createStatusMessage;
window.clearStatusMessages = clearStatusMessages;
window.safeGet = safeGet;
window.safeSet = safeSet;
window.createElement = createElement;
window.addEventListenerWithCleanup = addEventListenerWithCleanup;
window.batchDOMUpdates = batchDOMUpdates;
