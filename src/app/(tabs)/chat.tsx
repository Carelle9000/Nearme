import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { usePremium } from '@/context/premium-context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Conversation } from '@/models/user';
import { Colors, BorderRadius, Shadows } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalization } from '@/context/localization-context';

export default function ChatScreen() {
  const { conversations, isLoading, loadConversations } = useChat();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const router = useRouter();
  const { t } = useLocalization();

  useEffect(() => {
    loadConversations();
  }, []);

  const getTimeLabel = (date: string | Date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }

    const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return dayNames[messageDate.getDay()];
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserId = item.participants.find((id) => id !== user?.id) || '?';
    const otherUserName = item.participantNames?.[otherUserId] || 'Unknown';

    return (
      <TouchableOpacity
        style={[styles.conversationItem, Shadows.soft]}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: { id: item.id },
          })
        }
      >
        <View style={styles.avatarWrapper}>
          {item.participantPhotos?.[otherUserId] ? (
            <Image
              source={{ uri: item.participantPhotos[otherUserId] }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.text} />
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{otherUserName}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 'DÃ©marrer une conversation'}
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <Text style={styles.time}>{item.lastMessageAt ? getTimeLabel(item.lastMessageAt) : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading && conversations.length === 0) {
    return (
      <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[Colors.background, Colors.cardSurface]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Messages</Text>
            {conversations.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{conversations.length}</Text>
              </View>
            )}
          </View>
        </View>

        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start by liking someone!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>CONVERSATIONS</Text>
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
          </>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.cardSurface,
    borderRadius: BorderRadius.base,
    marginHorizontal: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.cardSurface,
  },
  contentContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 4,
    padding: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  timeContainer: {
    marginLeft: 12,
  },
  time: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

