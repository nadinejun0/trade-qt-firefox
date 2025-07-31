# DTI Trading Assistant - Firefox Extension

A Firefox browser extension that enhances DTI (Dress to Impress) closet pages with trading and wishlist management features. 

##WORK IN PROGRESS

## Features

- **Quick Item Copying**: Adds "Copy" buttons to each item for easy name copying
- **Wishlist Management**: Add items to a synced list with "+" buttons
- **Auto-Value Population**: Fetches trade values from Neopets automatically
- **Cross-Device Sync**: Your item list syncs across all your Firefox browsers
- **Export Functionality**: Copy all items in formatted text for forums/Discord

## Installation

### For Development/Testing

1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Navigate to the `firefox-extension` folder and select `manifest.json`

### For Production (Future)

The extension will be available on Firefox Add-ons once published.

## Usage

1. **On DTI Closet Pages**: You'll see "Copy" and "+" buttons on each item
   - Click "Copy" to copy just the item name
   - Click "+" to add the item to your list

2. **Managing Your List**: Use the floating notepad in the bottom-right corner
   - Click the pink "+" button to open/close the notepad
   - View all your saved items in the floating panel
   - Add manual items by typing in the input field
   - Edit values for each item inline
   - Use the refresh button (🔄) to update values from Neopets
   - Use the compare button to highlight items on the page
   - Copy all items or clear the list

3. **Auto-Values**: The extension can fetch current trade values from Neopets
   - Items with auto-populated values show a blue background and 🔄 icon
   - You can override any auto-populated value

4. **Compare Mode**: Click the compare button (⇄) to dim items not in your list
   - Helps you quickly identify items you're looking for
   - Click again to exit compare mode

## File Structure

```
firefox-extension/
├── manifest.json          # Extension configuration
├── content/               # Scripts that run on DTI pages
│   ├── content.js         # Main functionality + floating notepad
│   └── content.css        # Styling for buttons and notepad
├── background/            # Background processing
│   └── background.js      # Handles Neopets value fetching
└── icons/                 # Extension icons
    ├── icon-48.png        # TODO: Create actual icons
    └── icon-96.png        # TODO: Create actual icons
```

## TODO

- [ ] Create proper icon files (currently using placeholders)
- [ ] Add options page for user preferences
- [ ] Implement auto-refresh settings
- [ ] Add import/export functionality
- [ ] Consider Chrome compatibility

## Development Notes

This extension is built using the WebExtensions API and should be compatible with modern Firefox versions. The floating notepad is injected directly into DTI pages, similar to the original Tampermonkey script behavior. The code is structured to be easily portable to Chrome with minimal changes.

### Key Features
- **Floating Notepad**: Docked to bottom-right corner of DTI pages
- **Compare Mode**: Visual highlighting to help identify wanted items
- **Auto-Values**: Fetches trade values from Neopets with manual refresh
- **Cross-Device Sync**: Uses Firefox Sync to keep lists synchronized
- **Clean UI**: Modern design that integrates seamlessly with DTI

## Privacy

- All data is stored locally in your browser using Firefox's sync storage
- No data is sent to external servers except for fetching public trade values from Neopets
- Your item lists sync only between your own Firefox browsers when logged into Firefox Sync
