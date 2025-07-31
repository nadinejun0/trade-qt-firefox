// DTI Trading Assistant - Constants and Configuration

// CSS Classes
window.CSS_CLASSES = {
  COPY_BUTTON: 'dti-copy-button',
  ADD_BUTTON: 'dti-add-button',
  TOGGLE_BUTTON: 'dti-toggle-notepad-btn',
  NOTEPAD: 'dti-item-notepad',
  NOTEPAD_HEADER: 'dti-notepad-header',
  NOTEPAD_CONTENT: 'dti-notepad-content',
  TAB_ACTIVE: 'dti-tab-active',
  TAB_PANE_ACTIVE: 'dti-tab-pane-active',
  LOADING: 'dti-loading',
  ACTIVE: 'dti-active',
  HIDDEN: 'hidden',
  VISIBLE: 'visible'
};

// Supported Sites Configuration
window.SUPPORTED_SITES = {
  'impress.openneo.net': { name: 'Dress to Impress', enabled: true },
  'www.neopets.com': { name: 'Neopets', enabled: true },
  'neopets.com': { name: 'Neopets', enabled: true },
  'www.jellyneo.net': { name: 'JellyNeo', enabled: true },
  'jellyneo.net': { name: 'JellyNeo', enabled: true }
};

// Timing Constants (in milliseconds)
window.TIMING = {
  UPDATE_CHECK_INTERVAL: 1000,
  BUTTON_ADD_DELAY: 100,
  FOCUS_DELAY: 200,
  MUTATION_DELAY: 100,
  DEBOUNCE_DELAY: 300,
  BUTTON_FEEDBACK_DURATION: 1000,
  STATUS_MESSAGE_DURATION: 3000,
  SAVE_DEBOUNCE_DELAY: 500
};

// Storage Configuration
window.STORAGE = {
  MAX_SAVED_TRADELISTS: 20,
  CLEANUP_AGE_DAYS: 90,
  KEYS: {
    CURRENT_TRADELIST: 'currentTradelist',
    SAVED_TRADELISTS: 'savedTradelists',
    USER_TRADELISTS: 'userTradelists', // legacy
    NEOPETS_VALUES: 'neopetsValues',
    SETTINGS: 'settings',
    VALUES_TIMESTAMP: 'valuesTimestamp'
  }
};

// UI Configuration
window.UI = {
  NOTEPAD_WIDTH: 320,
  NOTEPAD_HEIGHT: 450,
  TOGGLE_BUTTON_SIZE: 48,
  TOGGLE_BUTTON_POSITION: {
    BOTTOM: 24,
    RIGHT: 24
  },
  NOTEPAD_POSITION: {
    BOTTOM: 92,
    RIGHT: 24
  },
  Z_INDEX: {
    NOTEPAD: 10000,
    TOGGLE_BUTTON: 10001,
    MODAL: 10002
  }
};

// API Configuration
window.API = {
  LEBRON_VALUES_URL: 'https://lebron-values.netlify.app/item_values.json',
  NEOPETS_NEOMAIL_URL: 'http://www.neopets.com/neomessages.phtml'
};

// Default Data Structures
window.DEFAULT_TRADELIST = {
  sendingItems: [],
  receivingItems: [],
  notes: '',
  lastModified: null // will be set to current ISO string
};

window.DEFAULT_SETTINGS = {
  autoCompare: false,
  showNotepad: true,
  autoRefreshEnabled: false,
  siteSettings: {}
};

// Item Sections
window.ITEM_SECTIONS = {
  OWNED: 'owned',
  WANTED: 'wanted',
  SENDING: 'sendingItems',
  RECEIVING: 'receivingItems'
};

// Status Message Types
window.MESSAGE_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// DOM Selectors
window.SELECTORS = {
  OBJECTS: '.object',
  CLOSET_HANGERS: '#closet-hangers',
  CLOSET_HANGERS_ALT: '.closet-hangers',
  CLOSET_HANGERS_GROUP: '.closet-hangers-group',
  NEOMAIL_LINK: '#closet-hangers-contact .neomail',
  LOOKUP_LINK: '#closet-hangers-contact .lookup',
  TITLE: '#title',
  USER_OWNS: '.user-owns',
  USER_WANTS: '.user-wants'
};

// Regular Expressions
window.REGEX = {
  NEOMAIL_USERNAME: /Neomail (.*)/,
  LOOKUP_USERNAME: /(.*)'s lookup/,
  TITLE_USERNAME: /(.*)'s items/,
  URL_USERNAME: /^\d+-(.*)$/,
  VALUE_RANGE: /^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/
};

// Button Text and Titles
window.BUTTON_TEXT = {
  WANT: 'Want',
  OFFER: 'Offer',
  WANT_TITLE: 'Add to Their Offer (I want this)',
  OFFER_TITLE: 'Add to My Offer (I can offer this)',
  SUCCESS_FEEDBACK: '✓'
};

// Error Messages
window.ERROR_MESSAGES = {
  STORAGE_QUOTA_EXCEEDED: 'Storage limit reached. Try clearing old data or contact support.',
  FETCH_VALUES_FAILED: 'Failed to fetch item values. Please try again later.',
  SAVE_FAILED: 'Failed to save data. Please try again.',
  LOAD_FAILED: 'Failed to load data. Please try again.',
  TRADELIST_NOT_FOUND: 'Tradelist not found.',
  NO_ITEMS_TO_SAVE: 'No items to save!',
  INVALID_TRADELIST_NAME: 'Please enter a name for the tradelist.'
};

// Success Messages
window.SUCCESS_MESSAGES = {
  VALUES_REFRESHED: 'Values refreshed successfully!',
  TRADELIST_SAVED: 'Tradelist saved successfully!',
  TRADELIST_LOADED: 'Tradelist loaded successfully!',
  TRADELIST_MERGED: 'Tradelist merged successfully!',
  TRADELIST_DELETED: 'Tradelist deleted.',
  DATA_CLEARED: 'All data cleared successfully!'
};

// Modal Configuration
window.MODAL = {
  SAVE_DIALOG: {
    TITLE: 'Save Tradelist',
    NAME_LABEL: 'List Name:',
    CLEAR_CHECKBOX_LABEL: 'Clear working list after saving',
    CANCEL_TEXT: 'Cancel',
    SAVE_TEXT: 'Save'
  },
  LOAD_DIALOG: {
    TITLE: 'Load Tradelist',
    REPLACE_LABEL: 'Replace current working list',
    MERGE_LABEL: 'Merge with current working list',
    CANCEL_TEXT: 'Cancel',
    DELETE_TEXT: 'Delete'
  }
};

// Auto-refresh Configuration
window.AUTO_REFRESH = {
  CHECK_INTERVAL_MINUTES: 60,
  REFRESH_INTERVAL_HOURS: 24,
  ALARM_NAME: 'autoRefreshValues'
};
