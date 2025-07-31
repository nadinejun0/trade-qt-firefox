# DTI Trading Assistant - Installation Guide

## Installing the Updated Extension (v1.1.0)

### For Firefox

1. **Open Firefox** and navigate to `about:debugging`

2. **Click "This Firefox"** in the left sidebar

3. **Click "Load Temporary Add-on"**

4. **Navigate to the extension folder** and select the `manifest.json` file

5. **The extension should now be loaded** and visible in your extensions list

### Testing the Storage Fix

1. **Visit a DTI user's closet page** (e.g., `https://impress.openneo.net/user/62553-adustumdti/closet`)

2. **Click the pink floating button** in the bottom-right corner to open the notepad

3. **Click the refresh button** (circular arrow icon) in the notepad header

4. **Verify that values load successfully** without any QuotaExceededError

### What's Fixed

- ✅ **No more QuotaExceededError** when refreshing values
- ✅ **Automatic data migration** from old storage format
- ✅ **Better error handling** with user-friendly messages
- ✅ **Storage cleanup** to prevent future quota issues
- ✅ **Improved performance** with hybrid storage approach

### Troubleshooting

If you encounter any issues:

1. **Check the browser console** (F12 → Console tab) for error messages
2. **Try refreshing the page** and testing again
3. **Clear extension data** by going to `about:debugging` → Extension → Remove, then reinstall
4. **Check storage usage** in Firefox settings if issues persist

### Data Migration

The extension will automatically:
- Migrate existing tradelists to the new format
- Move large data (item values) to local storage
- Clean up old data from sync storage
- Preserve all your existing tradelists and settings

No manual action is required - the migration happens transparently when you update to v1.1.0.
