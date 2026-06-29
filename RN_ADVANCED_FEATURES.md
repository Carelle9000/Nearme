# NearMe React Native - Advanced Features Documentation

## 📸 Photo Management System

### Components
- **ProfileContext** - Manages user's photo uploads, deletions, and ordering
- **ManagePhotosScreen** - Full-featured UI for photo management

### Features
- ✅ Pick photos from gallery
- ✅ Take photos with camera
- ✅ Delete individual photos
- ✅ Reorder photos (primary = first)
- ✅ Upload to Firebase Cloud Storage
- ✅ Display upload progress
- ✅ Photo tips & guidelines

### Usage
```tsx
const { pickAndUploadPhoto, deletePhoto, profilePhotos } = useProfile();

// Pick and upload
await pickAndUploadPhoto();

// Delete
await deletePhoto(photoUrl);
```

### Files
- `src/context/profile-context.tsx` - State management
- `src/app/profile/photos.tsx` - UI screen
- `src/services/photo.service.ts` - Firebase operations

---

## 🌍 Location Services & Synchronization

### Components
- **LocationSyncService** - Automatic background location updates
- **LocationService** - Single location request & address lookup

### Features
- ✅ Request location permissions (iOS/Android)
- ✅ Get current location
- ✅ Watch location changes
- ✅ Reverse geocoding (lat/lon → city)
- ✅ Background sync every 5 minutes
- ✅ Async storage for last sync time
- ✅ No sync if recently updated

### Usage
```tsx
// Single location request
const location = await locationService.getCurrentLocation();

// Start background sync
locationSyncService.startLocationSync(userId);

// Stop sync
locationSyncService.stopLocationSync();

// Get reverse geocoded address
const city = await locationService.getAddressFromCoordinates(lat, lon);
```

### Files
- `src/services/location.service.ts` - Core location
- `src/services/location-sync.service.ts` - Background sync

---

## 🔔 Notifications System

### Components
- **NotificationContext** - Global notification state
- **NotificationService** - FCM/Expo integration
- **NotificationProvider** - Context wrapper

### Features
- ✅ Request notification permissions
- ✅ Get FCM token from Expo
- ✅ Save token to user profile
- ✅ Send local notifications
- ✅ Handle notification taps
- ✅ Badge management

### Usage
```tsx
const { fcmToken, isNotificationEnabled, requestNotificationPermission } = useNotification();

// Request permission
const granted = await requestNotificationPermission();

// Send notification
await sendLocalNotification('Title', 'Body');
```

### Files
- `src/context/notification-context.tsx` - State
- `src/services/notification.service.ts` - Expo integration

---

## 🔍 Discovery Filters & Sorting

### Components
- **DiscoverFiltersContext** - Filter state management
- **FilterPanel** - Modal UI for filter adjustment
- **DiscoverFilterService** - Profile filtering logic

### Filters Available
- **Age Range** - Min/max age (18-65)
- **Distance** - Max distance in km (5-100 km)
- **Gender** - Male/Female/Other/All
- **Interests** - Optional interest matching

### Features
- ✅ Slider controls for age/distance
- ✅ Quick filter toggles
- ✅ Reset to defaults
- ✅ Profile filtering based on criteria
- ✅ Distance-based sorting
- ✅ Age calculation from birthDate

### Usage
```tsx
const { filters, updateFilters, resetFilters } = useDiscoverFilters();

// Update filters
updateFilters({ minAge: 20, maxAge: 35 });

// Filter profiles
const filtered = discoverFilterService.filterProfiles(profiles, filters, currentUserId);

// Sort by distance
const sorted = discoverFilterService.sortProfilesByDistance(filtered, lat, lon);
```

### Files
- `src/context/discover-filters-context.tsx` - State
- `src/components/filter-panel.tsx` - UI
- `src/services/discover-filter.service.ts` - Logic

---

## 🎨 UI/UX Components

### LoadingScreen
Simple, reusable loading indicator
```tsx
<LoadingScreen color="#FF1744" />
```

### ErrorMessage
Dismissible error with optional retry
```tsx
<ErrorMessage 
  message="Failed to load profiles"
  onDismiss={() => setError(null)}
  onRetry={retryAction}
/>
```

### EmptyState
Flexible empty state with optional action
```tsx
<EmptyState 
  icon="heart-discard-outline"
  title="No conversations yet"
  description="Start by liking someone!"
  actionText="Discover Profiles"
  onAction={navigateToDiscover}
/>
```

### Files
- `src/components/loading-screen.tsx`
- `src/components/error-message.tsx`
- `src/components/empty-state.tsx`

---

## 🔌 Provider Structure

All providers are nested in `src/app/_layout.tsx`:

```
RootLayout
├── ThemeProvider (Dark/Light mode)
└── AuthProvider
    └── NotificationProvider
        └── ProfileProvider
            └── DiscoverProvider
                └── DiscoverFiltersProvider
                    └── ChatProvider
```

Each provider gives its context hooks available to entire app.

---

## 📊 Data Flow Examples

### Photo Upload Flow
```
User taps "Add Photo"
    ↓
FilterPanel opens
    ↓
User selects Camera/Gallery
    ↓
useProfile().pickAndUploadPhoto()
    ↓
photoService.uploadProfilePhoto()
    ↓
Firebase Storage: upload blob
    ↓
Get download URL
    ↓
userService.updateProfile() with new photos
    ↓
ProfileContext state updates
    ↓
UI re-renders with new photo
```

### Location Sync Flow
```
App starts
    ↓
useAuth loads user
    ↓
locationSyncService.startLocationSync(userId)
    ↓
Every 5 minutes:
  ├─ getCurrentLocation()
  ├─ reverseGeocodeAddress()
  ├─ updateProfile() in Firestore
  └─ Update lastSyncTime
```

### Filter & Sort Flow
```
User opens Discovery
    ↓
loadNearbyProfiles() fetches profiles
    ↓
useDiscoverFilters() gets current filters
    ↓
discoverFilterService.filterProfiles()
    ↓
discoverFilterService.sortProfilesByDistance()
    ↓
ProfileCard displays sorted, filtered profiles
```

---

## 🧪 Testing Considerations

### Photo Management
- [ ] Pick image from gallery
- [ ] Take photo with camera
- [ ] Upload completes successfully
- [ ] Photo appears in list
- [ ] Delete removes photo
- [ ] Reorder updates primary

### Location
- [ ] Permission request works
- [ ] Background sync runs
- [ ] Address lookup returns city
- [ ] Location stored in Firestore

### Notifications
- [ ] Permission request works
- [ ] FCM token obtained
- [ ] Token saved to profile
- [ ] Local notification appears

### Filters
- [ ] Age sliders update state
- [ ] Distance slider updates state
- [ ] Gender toggle works
- [ ] Reset returns to defaults
- [ ] Filtering removes non-matching
- [ ] Sorting by distance works

---

## 🚀 Integration Checklist

- [x] Photo management context & service
- [x] Photo upload to Firebase Storage
- [x] Location service with permissions
- [x] Background location sync
- [x] Notification permissions & FCM
- [x] Discovery filters with modal UI
- [x] Profile filtering & sorting logic
- [x] Loading states UI component
- [x] Error messages UI component
- [x] Empty states UI component
- [x] All providers nested in root layout
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Firebase dependencies stabilized

---

## 📋 Known Limitations

1. **Location Sync**: Uses 5-min interval (configurable)
2. **Photo Upload**: Single file at a time
3. **Filters**: Optional interests (not required)
4. **Notifications**: Expo push service (not full FCM)

---

## 🔄 Next Phase Items

### Immediate
- [ ] Fix npm install dependencies
- [ ] Test compilation on web
- [ ] Test on iOS/Android devices

### Short Term
- [ ] Age verification (Stripe Identity)
- [ ] Face comparison endpoint
- [ ] Message read receipts
- [ ] Typing indicators

### Medium Term
- [ ] Advanced filters (interests UI)
- [ ] Profile search/discovery
- [ ] User blocking/reporting
- [ ] Analytics & crash reporting

---

**Status**: Advanced features implemented (Phase 2 complete)
**Commits**: 1 (61e58de7)
**Lines Added**: ~1200
**Last Updated**: 2026-06-29
