import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/router/app_routes.dart';
import '../../core/widgets/signed_photo_image.dart';
import '../../data/models/conversation.dart';
import '../../data/models/app_user.dart';
import '../auth/auth_provider.dart';
import 'chat_provider.dart';

/// Écran de liste des conversations
class ConversationsListScreen extends StatefulWidget {
  const ConversationsListScreen({super.key});

  @override
  State<ConversationsListScreen> createState() => _ConversationsListScreenState();
}

class _ConversationsListScreenState extends State<ConversationsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = context.read<AuthProvider>();
      final userId = authProvider.user?.id;
      if (userId != null) {
        context.read<ChatProvider>().init(userId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Messages',
          style: GoogleFonts.fraunces(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
      ),
      body: Consumer<ChatProvider>(
        builder: (context, chatProvider, child) {
          if (chatProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(color: AppColors.violet),
            );
          }

          if (chatProvider.conversations.isEmpty) {
            return _EmptyState();
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: chatProvider.conversations.length,
            itemBuilder: (context, index) {
              final conversation = chatProvider.conversations[index];
              return _ConversationTile(
                conversation: conversation,
                onTap: () => _openConversation(context, conversation, chatProvider),
              );
            },
          );
        },
      ),
    );
  }

  void _openConversation(
    BuildContext context,
    Conversation conversation,
    ChatProvider chatProvider,
  ) {
    final authProvider = context.read<AuthProvider>();
    final myUserId = authProvider.user?.id;
    final otherUserId = conversation.getOtherParticipant(myUserId ?? '');
    
    if (otherUserId == null) return;

    // Marquer comme lu avant d'ouvrir
    chatProvider.markAsRead(conversation.id);

    // Naviguer vers l'écran de conversation
    Navigator.of(context).pushNamed(
      AppRoutes.conversation,
      arguments: {
        'conversationId': conversation.id,
        'otherUserId': otherUserId,
      },
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.violet.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.violet.withValues(alpha: 0.30),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.chat_bubble_outline_rounded,
                size: 40,
                color: AppColors.violet,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'No conversations yet',
              style: GoogleFonts.fraunces(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              'Match with someone to start chatting!',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final chatProvider = context.watch<ChatProvider>();
    
    final myUserId = authProvider.user?.id ?? '';
    final otherUserId = conversation.getOtherParticipant(myUserId);
    final otherUser = otherUserId != null ? chatProvider.getUserProfile(otherUserId) : null;
    final unreadCount = conversation.getUnreadCount(myUserId);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            // Avatar
            _UserAvatar(user: otherUser),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          otherUser?.name ?? 'Unknown',
                          style: GoogleFonts.dmSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (conversation.lastMessageAt != null)
                        Text(
                          _formatTime(conversation.lastMessageAt!),
                          style: GoogleFonts.dmSans(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          conversation.lastMessage ?? 'No messages yet',
                          style: GoogleFonts.dmSans(
                            fontSize: 14,
                            color: unreadCount > 0
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                            fontWeight: unreadCount > 0
                                ? FontWeight.w600
                                : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (unreadCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.violet,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            unreadCount > 9 ? '9+' : unreadCount.toString(),
                            style: GoogleFonts.dmSans(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'Now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m';
    } else if (difference.inDays < 1) {
      return DateFormat('HH:mm').format(dateTime);
    } else if (difference.inDays < 7) {
      return DateFormat('EEE').format(dateTime);
    } else {
      return DateFormat('dd/MM/yyyy').format(dateTime);
    }
  }
}

class _UserAvatar extends StatelessWidget {
  final AppUser? user;

  const _UserAvatar({required this.user});

  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: AppColors.surfaceHigh,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.border),
        ),
        child: const Icon(
          Icons.person_outline,
          color: AppColors.textMuted,
          size: 28,
        ),
      );
    }

    final hasPhoto = user?.photos != null && user!.photos!.isNotEmpty;
    final photoUrl = hasPhoto ? user!.photos!.first : null;

    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.surfaceHigh,
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.antiAlias,
      child: photoUrl != null
          ? SignedPhotoImage(
              path: photoUrl,
              fit: BoxFit.cover,
            )
          : Center(
              child: Text(
                user?.name.substring(0, 1).toUpperCase() ?? '?',
                style: GoogleFonts.dmSans(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.violet,
                ),
              ),
            ),
    );
  }
}
