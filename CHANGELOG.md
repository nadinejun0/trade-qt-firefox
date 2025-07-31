# DTI Trading Assistant - Changelog

## Version 1.1.0 - Storage Quota Fix

### Fixed
- **QuotaExceededError**: Resolved storage.sync quota exceeded errors by implementing hybrid storage strategy
- **Storage Management**: Large datasets (neopetsValues) now stored in storage.local instead of storage.sync
- **Data Migration**: Automatic migration of existing data from sync to local storage
- **Error Handling**: Improved error handling with user-friendly messages and automatic fallbacks

### Added
- **Storage Cleanup**: Automatic cleanup of old tradelists (90+ days) to prevent storage bloat
- **Quota Monitoring**: Background monitoring of storage usage with warnings
- **Fallback System**: Graceful fallback to localStorage when browser storage fails
- **Data Limits**: Enforced maximum of 10 tradelists per user to prevent storage issues
- **Status Messages**: Visual feedback for storage operations and errors

### Changed
- **Storage Architecture**: Hybrid approach using both storage.sync and storage.local
- **Data Structure**: Improved tradelist data structure with timestamps and metadata
- **Performance**: Reduced storage write operations through batching and debouncing
- **User Experience**: Better error messages and automatic recovery from storage issues

### Technical Details
- `neopetsValues` moved from storage.sync (100KB limit) to storage.local (several MB limit)
- Only user-specific data (`userTradelists`, `settings`) remains in storage.sync for cross-device sync
- Automatic data migration on extension update
- Background cleanup tasks to maintain storage health
- Improved error handling for quota exceeded scenarios

### Migration Notes
- Existing users will have their data automatically migrated on extension update
- No user action required - migration happens transparently
- Old data in storage.sync is cleaned up after successful migration
