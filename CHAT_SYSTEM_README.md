# NearMe Chat System Documentation

## Overview

This document describes the complete chat/messaging system implemented for the NearMe dating application. The system follows best practices for dating app messaging with security, scalability, and user experience in mind.

## Features Implemented

### ✅ Core Features (Priority 1)
- **Text Messaging**: Send and receive real-time text messages
- **Conversation List**: View all conversations with last message preview
- **Real-time Updates**: Stream-based message updates using Firestore
- **Read/Unread Status**: Track message read status per user
- **Match Verification**: Chat only allowed between matched users
- **User Blocking**: Block users to prevent unwanted messages
- **Conversation Deletion**: Delete entire conversations
- **User Reporting**: Report inappropriate behavior

### ✅ Enhanced Features (Priority 2)
- **Image Messages**: Send photos in chat (uploaded to Firebase Storage)
- **Typing Indicators**: Real-time "typing..." status
- **Online Presence**: Track user online status and last seen
- **Push Notifications**: FCM notifications for new messages
- **Firestore Security Rules**: Comprehensive security rules for all collections

## Architecture

### Data Structure

#### Conversations Collection
```
conversations/{conversationId}
├── participants: ["uid1", "uid2"]
├── lastMessage: "Last message content"
├── lastMessageAt: Timestamp
├── createdAt: Timestamp
└── unreadCount: { "uid1": 0, "uid2": 2 }
```

#### Messages Subcollection
```
conversations/{conversationId}/messages/{messageId}
├── senderId: "uid"
├── content: "Message text"
├── type: "text" | "image" | "voice"
├── createdAt: Timestamp
├── read: false
├── imageUrl: "https://..." (for image messages)
└── audioUrl: "https://..." (for voice messages)
```

#### Typing Indicators Subcollection
```
conversations/{conversationId}/typing/{userId}
├── isTyping: true
└── timestamp: Timestamp
```

#### Blocks Collection
```
blocks/{blockId}
├── blockerId: "uid1"
├── blockedId: "uid2"
└── createdAt: Timestamp
```

#### Reports Collection
```
reports/{reportId}
├── reporterId: "uid1"
├── reportedUserId: "uid2"
├── reason: "Inappropriate behavior"
├── status: "pending"
└── createdAt: Timestamp
```

### File Structure

```
lib/
├── data/
│   ├── models/
│   │   └── conversation.dart          # ChatMessage, Conversation models
│   └── services/
│       ├── chat_service.dart          # Core chat logic
│       ├── presence_service.dart      # Online presence tracking
│       └── push_notification_service.dart  # FCM notifications
├── features/
│   └── chat/
│       ├── chat_provider.dart         # State management
│       ├── conversations_list_screen.dart  # Conversation list UI
│       └── conversation_screen.dart   # Individual chat UI
└── core/
    └── widgets/
        └── signed_photo_image.dart    # Image display (updated for Base64)
```

## Implementation Details

### 1. Models (`conversation.dart`)

**ChatMessage Class**
- Supports text, image, and voice message types
- Tracks read status and timestamps
- Includes metadata for media (imageUrl, audioUrl, duration)

**Conversation Class**
- Manages participant list (always 2 users)
- Tracks unread count per user
- Helper methods for getting other participant

### 2. Chat Service (`chat_service.dart`)

**Key Methods:**
- `createConversation()`: Creates conversation only if match exists
- `sendTextMessage()`: Sends text message with conversation update
- `sendImageMessage()`: Uploads image to Storage then sends message
- `markMessagesAsRead()`: Updates read status for user
- `deleteConversation()`: Removes conversation and all messages
- `setTypingStatus()`: Updates typing indicator
- `blockUser()` / `unblockUser()`: Manages user blocking
- `reportUser()`: Reports inappropriate behavior

**Security:**
- All operations verify user authentication
- Match verification before conversation creation
- Block checking before message operations

### 3. Chat Provider (`chat_provider.dart`)

**State Management:**
- Streams conversations and messages in real-time
- Caches user profiles for performance
- Manages typing status subscriptions
- Tracks blocked users

**Key Features:**
- Automatic message loading when conversation opened
- Typing indicator with auto-cleanup (3-second timeout)
- Local state updates for immediate UI feedback
- Total unread count calculation

### 4. UI Components

**ConversationsListScreen**
- Displays all user conversations
- Shows last message preview and timestamp
- Unread message count badge
- Empty state for no conversations
- Avatar display with fallback

**ConversationScreen**
- Real-time message display
- Message bubbles with read receipts
- Image message support
- Typing indicator display
- Online status display
- Block/Report/Delete options
- Image picker for sending photos

### 5. Presence Service (`presence_service.dart`)

**Features:**
- Automatic online status tracking
- Heartbeat system (every minute)
- Last seen timestamp updates
- Stream-based presence monitoring
- Formatted presence display ("Online", "Seen 5m ago")

### 6. Push Notifications (`push_notification_service.dart`)

**Features:**
- FCM token registration
- Token refresh handling
- Foreground/background message handling
- Token cleanup on logout

**Cloud Function (`onNewMessage`):**
- Triggered when new message sent
- Finds recipient from conversation
- Sends push notification to all FCM tokens
- Cleans up invalid tokens
- Supports different message types (text, image, voice)

### 7. Firestore Security Rules

**Conversations:**
```javascript
match /conversations/{conversationId} {
  allow read: if isAuth() && request.auth.uid in resource.data.participants;
  allow create: if isAuth() && 
    request.auth.uid in request.resource.data.participants &&
    request.resource.data.participants.size() == 2 &&
    exists(/databases/$(database)/documents/matches/$(conversationId));
  allow update, delete: if isAuth() && request.auth.uid in resource.data.participants;
}
```

**Messages:**
```javascript
match /messages/{messageId} {
  allow read: if isAuth() && 
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
  allow create: if isAuth() && 
    request.auth.uid == request.data.senderId &&
    request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
}
```

**Key Security Features:**
- Only participants can read conversations
- Match verification required for conversation creation
- Only sender can create messages
- Block/report collections properly secured

## Setup Instructions

### 1. Install Dependencies

```bash
flutter pub get
```

### 2. Update Firestore Rules

Deploy the updated `firestore.rules` file to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

### 3. Deploy Cloud Functions

Build and deploy the chat notification function:

```bash
cd functions
npm run build
firebase deploy --only functions
```

### 4. Initialize Services

In your app's initialization (e.g., `main.dart`):

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Firebase.initializeApp();
  
  // Initialize push notifications
  final pushService = PushNotificationService();
  await pushService.init();
  
  // Initialize presence service
  final presenceService = PresenceService();
  presenceService.init();
  
  runApp(MyApp());
}
```

### 5. Add Chat Provider

Wrap your app with the ChatProvider:

```dart
MultiProvider(
  providers: [
    // ... other providers
    ChangeNotifierProvider(create: (_) => ChatProvider()),
  ],
  child: MyApp(),
)
```

### 6. Add Routes

Add chat routes to your router:

```dart
'/chat': (context) => const ConversationsListScreen(),
'/chat/conversation': (context) => const ConversationScreen(),
```

## Usage Examples

### Starting a Chat

```dart
// From match screen or profile
final chatProvider = context.read<ChatProvider>();
final conversationId = await chatProvider.createConversation(otherUserId);

if (conversationId != null) {
  Navigator.of(context).pushNamed(
    '/chat/conversation',
    arguments: {
      'conversationId': conversationId,
      'otherUserId': otherUserId,
    },
  );
}
```

### Sending a Message

```dart
final chatProvider = context.read<ChatProvider>();
await chatProvider.sendTextMessage(conversationId, "Hello!");
```

### Blocking a User

```dart
final chatProvider = context.read<ChatProvider>();
await chatProvider.blockUser(userId);
```

### Reporting a User

```dart
final chatProvider = context.read<ChatProvider>();
await chatProvider.reportUser(userId, "Inappropriate behavior");
```

## Future Enhancements

### Planned Features (Not Yet Implemented)

1. **Voice Messages**
   - Audio recording with `record` package
   - Audio playback with `audioplayers` package
   - Upload to Firebase Storage
   - Duration display and waveform visualization

2. **Message Encryption**
   - End-to-end encryption using Signal protocol
   - Key exchange via Firestore
   - Encrypted message storage

3. **Ephemeral Messages**
   - Self-destructing messages (like Snapchat)
   - Configurable expiration times
   - Cloud Functions for automatic deletion

4. **Message Reactions**
   - Emoji reactions to messages
   - Reaction counts and display
   - Real-time reaction updates

5. **Message Editing/Deletion**
   - Edit sent messages within time limit
   - Delete messages for both users
   - "Delete for me" option

6. **Rich Media Support**
   - Video messages
   - GIF support
   - Location sharing
   - Contact sharing

7. **Advanced Moderation**
   - Automated content filtering
   - Spam detection
   - Rate limiting per user
   - Admin moderation tools

## Troubleshooting

### Messages Not Appearing

1. Check Firestore rules are deployed
2. Verify user is authenticated
3. Check console for permission errors
4. Ensure match exists between users

### Notifications Not Working

1. Verify FCM token is registered
2. Check Cloud Function is deployed
3. Test with Firebase Console
4. Verify notification permissions on device

### Typing Indicator Not Showing

1. Check typing subscription is active
2. Verify timestamp comparison logic
3. Ensure both users have conversation loaded

### Images Not Sending

1. Check Firebase Storage rules
2. Verify image picker permissions
3. Check file size limits
4. Ensure sufficient storage quota

## Performance Considerations

### Optimization Strategies

1. **Message Pagination**: Implement pagination for long conversations
2. **Image Caching**: Use cached network images for performance
3. **Debouncing**: Debounce typing status updates
4. **Batch Operations**: Use batch writes for multiple updates
5. **Index Optimization**: Add Firestore indexes for common queries

### Recommended Indexes

Create these Firestore indexes for optimal performance:

```javascript
// conversations collection
conversations
  - participants (array)
  - lastMessageAt (descending)

// messages subcollection
conversations/{conversationId}/messages
  - createdAt (ascending)
```

## Security Best Practices

1. **Never Trust Client Data**: Always validate on server
2. **Use Firestore Rules**: Implement comprehensive rules
3. **Rate Limiting**: Add rate limits to prevent spam
4. **Content Moderation**: Implement content filtering
5. **User Reporting**: Easy reporting mechanism
6. **Data Minimization**: Only store necessary data
7. **Regular Audits**: Review security rules regularly

## Testing

### Manual Testing Checklist

- [ ] Create conversation from match
- [ ] Send text message
- [ ] Receive message in real-time
- [ ] Mark messages as read
- [ ] Send image message
- [ ] Block user
- [ ] Report user
- [ ] Delete conversation
- [ ] Typing indicator works
- [ ] Online status displays
- [ ] Push notifications received
- [ ] Unread count updates

### Automated Testing

Consider adding unit tests for:
- [ ] ChatService methods
- [ ] ChatProvider state management
- [ ] Model serialization
- [ ] Security rule validation

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review Firestore rules
3. Verify Cloud Function deployment
4. Check device permissions
5. Review this documentation

## Credits

Chat system implemented following best practices from:
- Firebase Cloud Messaging documentation
- Firestore security patterns
- Dating app messaging standards
- Flutter state management patterns
