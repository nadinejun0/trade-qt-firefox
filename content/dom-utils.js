// DTI Trading Assistant - DOM Utilities

/**
 * dom utilities for creating and manipulating elements
 */
window.DOMUtils = class DOMUtils {
  
  /**
   * inject css styles into the page
   * @param {string} cssPath - path to css file
   */
  static injectStyles(cssPath) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = browser.runtime.getURL(cssPath);
    document.head.appendChild(link);
  }

  /**
   * create copy button for item
   * @param {HTMLElement} objectEl - item element
   * @returns {HTMLElement} button element
   */
  static createCopyButton(objectEl) {
    const button = createElement('button', {
      className: window.CSS_CLASSES.COPY_BUTTON,
      title: 'Copy item name'
    });

    // add copy icon svg
    button.innerHTML = `
      <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
        <path d="M21,8H9A1,1,0,0,0,8,9V21a1,1,0,0,0,1,1H21a1,1,0,0,0,1-1V9A1,1,0,0,0,21,8ZM20,20H10V10H20ZM6,15a1,1,0,0,1-1,1H3a1,1,0,0,1-1-1V3A1,1,0,0,1,3,2H15a1,1,0,0,1,1,1V5a1,1,0,0,1-2,0V4H4V14H5A1,1,0,0,1,6,15Z"/>
      </svg>
    `;

    return button;
  }

  /**
   * create add button for item
   * @param {HTMLElement} objectEl - item element
   * @returns {HTMLElement} button element
   */
  static createAddButton(objectEl) {
    const sourceSection = this.getItemSection(objectEl);
    const button = createElement('button', {
      className: window.CSS_CLASSES.ADD_BUTTON
    });
    
    // set button text and title based on source section
    if (sourceSection === window.ITEM_SECTIONS.OWNED) {
      button.textContent = window.BUTTON_TEXT.WANT;
      button.title = window.BUTTON_TEXT.WANT_TITLE;
    } else {
      button.textContent = window.BUTTON_TEXT.OFFER;
      button.title = window.BUTTON_TEXT.OFFER_TITLE;
    }

    return button;
  }

  /**
   * create floating toggle button
   * @returns {HTMLElement} toggle button
   */
  static createToggleButton() {
    const button = createElement('button', {
      className: window.CSS_CLASSES.TOGGLE_BUTTON,
      title: 'Toggle notepad'
    }, '+');

    return button;
  }

  /**
   * create notepad container
   * @returns {HTMLElement} notepad container
   */
  static createNotepadContainer() {
    const container = createElement('div', {
      className: `${window.CSS_CLASSES.NOTEPAD} ${window.CSS_CLASSES.HIDDEN}`
    });

    return container;
  }

  /**
   * create notepad header
   * @param {string} headerContent - html content for header
   * @returns {HTMLElement} header element
   */
  static createNotepadHeader(headerContent) {
    const header = createElement('div', {
      className: window.CSS_CLASSES.NOTEPAD_HEADER
    });
    
    header.innerHTML = headerContent;
    return header;
  }

  /**
   * create notepad content area
   * @returns {HTMLElement} content element
   */
  static createNotepadContent() {
    const content = createElement('div', {
      className: window.CSS_CLASSES.NOTEPAD_CONTENT
    });

    return content;
  }

  /**
   * create balance bar
   * @param {string} receivingText - receiving balance text
   * @param {string} sendingText - sending balance text
   * @returns {HTMLElement} balance bar element
   */
  static createBalanceBar(receivingText, sendingText) {
    const balanceBar = createElement('div', {
      className: 'dti-balance-bar'
    });

    balanceBar.innerHTML = `
      <span class="dti-balance-offer">RECEIVING: ${receivingText}</span>
      <span class="dti-balance-offer">SENDING: ${sendingText}</span>
    `;

    return balanceBar;
  }

  /**
   * create tab navigation
   * @param {Array} tabs - array of tab objects with name and count
   * @returns {HTMLElement} tab navigation element
   */
  static createTabNavigation(tabs) {
    const nav = createElement('div', {
      className: 'dti-tab-navigation'
    });

    tabs.forEach((tab, index) => {
      const tabButton = createElement('button', {
        className: `dti-tab ${index === 0 ? window.CSS_CLASSES.TAB_ACTIVE : ''}`,
        'data-tab': tab.name
      }, `${tab.label} (${tab.count})`);

      nav.appendChild(tabButton);
    });

    return nav;
  }

  /**
   * create tab content container
   * @param {Array} tabPanes - array of tab pane objects
   * @returns {HTMLElement} tab content container
   */
  static createTabContent(tabPanes) {
    const container = createElement('div', {
      className: 'dti-tab-content'
    });

    tabPanes.forEach((pane, index) => {
      const paneEl = createElement('div', {
        className: `dti-tab-pane ${index === 0 ? window.CSS_CLASSES.TAB_PANE_ACTIVE : ''}`,
        'data-tab-content': pane.name
      });

      if (pane.items.length === 0) {
        const emptyState = createElement('div', {
          className: 'dti-empty-state'
        }, pane.emptyMessage);
        paneEl.appendChild(emptyState);
      } else {
        pane.items.forEach((item, itemIndex) => {
          const itemEl = this.createListItem(item, pane.name, itemIndex);
          paneEl.appendChild(itemEl);
        });
      }

      container.appendChild(paneEl);
    });

    return container;
  }

  /**
   * create list item element
   * @param {Object} item - item data
   * @param {string} section - section name
   * @param {number} index - item index
   * @returns {HTMLElement} list item element
   */
  static createListItem(item, section, index) {
    const listItem = createElement('div', {
      className: 'dti-list-item',
      'data-section': section,
      'data-index': index
    });

    const itemName = createElement('div', {
      className: 'dti-item-name'
    }, item.name);

    const controls = createElement('div', {
      className: 'dti-item-controls'
    });

    const input = createElement('input', {
      type: 'text',
      className: 'dti-item-input',
      placeholder: 'Enter value',
      value: item.value || '',
      'data-section': section,
      'data-index': index
    });

    const removeBtn = createElement('button', {
      className: 'dti-remove-btn',
      'data-section': section,
      'data-index': index,
      title: 'Remove item'
    }, '×');

    controls.appendChild(input);
    controls.appendChild(removeBtn);

    listItem.appendChild(itemName);
    listItem.appendChild(controls);

    return listItem;
  }

  /**
   * create modal overlay
   * @returns {HTMLElement} modal overlay
   */
  static createModalOverlay() {
    const overlay = createElement('div', {
      className: 'dti-modal-overlay'
    });

    return overlay;
  }

  /**
   * create modal dialog
   * @param {string} className - modal class name
   * @param {string} content - modal html content
   * @returns {HTMLElement} modal dialog
   */
  static createModal(className, content) {
    const modal = createElement('div', {
      className: className
    });

    modal.innerHTML = content;
    return modal;
  }

  /**
   * create status message element
   * @param {string} message - message text
   * @param {string} type - message type
   * @returns {HTMLElement} status message element
   */
  static createStatusMessage(message, type) {
    const messageDiv = createElement('div', {
      className: `dti-status-message ${type}`
    }, message);

    return messageDiv;
  }

  /**
   * get item name from object element
   * @param {HTMLElement} objectEl - item element
   * @returns {string|null} item name or null
   */
  static getItemName(objectEl) {
    const link = objectEl.querySelector('a');
    if (!link) return null;

    const nameEl = link.querySelector('.name');
    return nameEl?.textContent.trim() || link.textContent.trim() || null;
  }

  /**
   * detect which section an item comes from on the dti page
   * @param {HTMLElement} itemElement - item element
   * @returns {string} section type (owned/wanted)
   */
  static getItemSection(itemElement) {
    // 1. dti attribute – preferred (most reliable)
    const group = itemElement.closest(window.SELECTORS.CLOSET_HANGERS_GROUP);
    if (group && group.dataset && 'owned' in group.dataset) {
      return group.dataset.owned === 'true' ? window.ITEM_SECTIONS.OWNED : window.ITEM_SECTIONS.WANTED;
    }

    // 2. fallback for other sites that use .user-owns / .user-wants
    if (itemElement.closest(`${window.SELECTORS.USER_OWNS}, [data-section="owns"]`)) {
      return window.ITEM_SECTIONS.OWNED;
    }
    if (itemElement.closest(`${window.SELECTORS.USER_WANTS}, [data-section="wants"]`)) {
      return window.ITEM_SECTIONS.WANTED;
    }

    // 3. legacy heading-text heuristic as last resort
    console.warn('DTI Trading Assistant: Using fallback item detection for element:', itemElement);
    return this._legacyHeadingHeuristic(itemElement);
  }

  /**
   * legacy heading-text heuristic for fallback
   * @private
   * @param {HTMLElement} itemElement
   * @returns {string}
   */
  static _legacyHeadingHeuristic(itemElement) {
    // check the section headers to determine context
    let currentSection = itemElement;
    while (currentSection && currentSection.parentElement) {
      const prevSibling = currentSection.previousElementSibling;
      if (prevSibling && prevSibling.textContent) {
        const text = prevSibling.textContent.toLowerCase();
        if (text.includes('owns') || text.includes('owned')) return window.ITEM_SECTIONS.OWNED;
        if (text.includes('wants') || text.includes('wanted') || text.includes('wishlist')) return window.ITEM_SECTIONS.WANTED;
      }
      currentSection = currentSection.parentElement;
    }
    
    // default to 'wanted' if we can't determine
    return window.ITEM_SECTIONS.WANTED;
  }

  /**
   * get username from dti page
   * @returns {string|null} username or null
   */
  static getUsername() {
    // 1. try from neomail link
    const neomailLinkEl = document.querySelector(window.SELECTORS.NEOMAIL_LINK);
    if (neomailLinkEl) {
      const match = neomailLinkEl.textContent.match(window.REGEX.NEOMAIL_USERNAME);
      if (match && match[1]) return match[1].trim();
    }

    // 2. try from userlookup link
    const lookupLinkEl = document.querySelector(window.SELECTORS.LOOKUP_LINK);
    if (lookupLinkEl) {
      const match = lookupLinkEl.textContent.match(window.REGEX.LOOKUP_USERNAME);
      if (match && match[1]) return match[1].trim();
    }

    // 3. try from h1 title
    const titleEl = document.querySelector(window.SELECTORS.TITLE);
    if (titleEl) {
      const match = titleEl.textContent.match(window.REGEX.TITLE_USERNAME);
      if (match && match[1]) return match[1].trim();
    }

    // 4. fallback to url
    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    if (userIndex !== -1 && userIndex + 1 < pathParts.length) {
      const usernameFromUrl = pathParts[userIndex + 1];
      // the url might have a format like "0000-Username"
      const urlMatch = usernameFromUrl.match(window.REGEX.URL_USERNAME);
      if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
      }
      return usernameFromUrl;
    }
    
    return null;
  }

  /**
   * get full user identifier from url (e.g., "1719-Flo")
   * @returns {string|null} user identifier or null
   */
  static getUserIdentifier() {
    const pathParts = window.location.pathname.split('/');
    const userIndex = pathParts.indexOf('user');
    if (userIndex !== -1 && userIndex + 1 < pathParts.length) {
      return pathParts[userIndex + 1];
    }
    return null;
  }

  /**
   * add buttons to objects that don't have them
   * @param {Function} onCopyClick - copy button click handler
   * @param {Function} onAddClick - add button click handler
   */
  static addButtonsToObjects(onCopyClick, onAddClick) {
    const objects = document.querySelectorAll(window.SELECTORS.OBJECTS);
    
    objects.forEach(obj => {
      // skip if buttons already exist
      if (obj.querySelector(`.${window.CSS_CLASSES.COPY_BUTTON}`) || 
          obj.querySelector(`.${window.CSS_CLASSES.ADD_BUTTON}`)) {
        return;
      }

      const buttonContainer = createElement('div', {
        style: { textAlign: 'center' }
      });

      const copyButton = this.createCopyButton(obj);
      const addButton = this.createAddButton(obj);

      // attach event listeners
      copyButton.addEventListener('click', (e) => onCopyClick(e, obj));
      addButton.addEventListener('click', (e) => onAddClick(e, obj));

      buttonContainer.appendChild(copyButton);
      buttonContainer.appendChild(addButton);
      obj.appendChild(buttonContainer);
    });
  }

  /**
   * toggle element visibility with animation classes
   * @param {HTMLElement} element - element to toggle
   * @param {boolean} show - true to show, false to hide
   */
  static toggleVisibility(element, show) {
    if (show) {
      element.classList.remove(window.CSS_CLASSES.HIDDEN);
      element.classList.add(window.CSS_CLASSES.VISIBLE);
    } else {
      element.classList.remove(window.CSS_CLASSES.VISIBLE);
      element.classList.add(window.CSS_CLASSES.HIDDEN);
    }
  }

  /**
   * clear all status messages from container
   * @param {HTMLElement} container - container element
   */
  static clearStatusMessages(container) {
    const messages = container.querySelectorAll('.dti-status-message');
    messages.forEach(msg => msg.remove());
  }

  /**
   * show status message in container
   * @param {HTMLElement} container - container element
   * @param {string} message - message text
   * @param {string} type - message type
   * @param {number} duration - auto-remove duration in ms
   */
  static showStatusMessage(container, message, type, duration = 3000) {
    // remove existing messages
    this.clearStatusMessages(container);
    
    const messageEl = this.createStatusMessage(message, type);
    container.insertBefore(messageEl, container.firstChild);
    
    // auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        if (messageEl.parentNode) {
          messageEl.remove();
        }
      }, duration);
    }
  }

  /**
   * toggle compare mode styling
   * @param {boolean} enable - true to enable compare mode
   */
  static toggleCompareMode(enable) {
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
      if (enable) {
        hangersEl.classList.add('comparing');
      } else {
        hangersEl.classList.remove('comparing');
      }
    }
  }

  /**
   * highlight wanted items in compare mode
   * @param {Array} wantedItemNames - array of wanted item names
   */
  static highlightWantedItems(wantedItemNames) {
    if (!wantedItemNames || wantedItemNames.length === 0) return;

    const objects = document.querySelectorAll(window.SELECTORS.OBJECTS);
    objects.forEach(obj => {
      const itemName = this.getItemName(obj);
      if (itemName && wantedItemNames.includes(itemName)) {
        obj.classList.add('dti-wanted-item');
      } else {
        obj.classList.remove('dti-wanted-item');
      }
    });
  }
};
