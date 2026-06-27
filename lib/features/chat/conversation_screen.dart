import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../core/theme/app_colors.dart';
import '../../core/widgets/signed_photo_image.dart';
import '../../core/utils/toasts.dart';
import '../../data/models/conversation.dart';
import '../../data/models/app_user.dart';
import '../../data/services/user_service.dart';
import '../auth/auth_provider.dart';
import 'chat_provider.dart';

/// Écran de conversation individuelle
class ConversationScreen extends StatefulWidget {
  const ConversationScreen({super.key});

  @override
  State<ConversationScreen> createState() => _ConversationScreenState();
}

class _ConversationScreenState extends State<ConversationScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();
  final UserService _userService = UserService();

  String? _conversationId;
  String? _otherUserId;
  AppUser? _otherUser;
  int _lastMessageCount = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, String>?;
    if (args != null && _conversationId == null) {
      _conversationId = args['conversationId'];
      _otherUserId = args['otherUserId'];
      
      // Charger les messages
      if (_conversationId != null) {
        context.read<ChatProvider>().loadConversationMessages(_conversationId!);
      }
      
      // Charger le profil de l'autre utilisateur
      _loadOtherUser();
    }
  }

  Future<void> _loadOtherUser() async {
    if (_otherUserId == null) return;
    final chatProvider = context.read<ChatProvider>();
    final user = chatProvider.getUserProfile(_otherUserId!);
    if (user != null) {
      setState(() => _otherUser = user);
      return;
    }

    final fetchedUser = await _userService.getUserById(_otherUserId!);
    if (mounted && fetchedUser != null) {
      setState(() => _otherUser = fetchedUser);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty || _conversationId == null) return;
    
    context.read<ChatProvider>().sendTextMessage(_conversationId!, text);
    _controller.clear();
  }

  Future<void> _sendImage() async {
    if (_conversationId == null) return;
    
    final xfile = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    
    if (xfile == null) return;
    
    final success = await context.read<ChatProvider>().sendImageMessage(
          _conversationId!,
          await xfile.readAsBytes(),
          xfile.name,
        );
    
    if (!success && mounted) {
      AppToasts.error(context, 'Failed to send image');
    }
  }

  void _scrollToBottomIfNeeded(int messageCount) {
    if (messageCount <= _lastMessageCount) return;
    _lastMessageCount = messageCount;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }

  void _showBlockDialog() {
    if (_otherUser == null) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Block ${_otherUser!.name}?',
          style: GoogleFonts.dmSans(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'You won\'t receive messages from this user anymore.',
          style: GoogleFonts.dmSans(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.dmSans(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              context.read<ChatProvider>().blockUser(_otherUserId!);
              Navigator.pop(context);
              Navigator.pop(context);
              AppToasts.success(context, 'User blocked');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.pink),
            child: Text(
              'Block',
              style: GoogleFonts.dmSans(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDialog() {
    if (_otherUser == null) return;
    
    final reasons = [
      'Inappropriate behavior',
      'Harassment',
      'Spam',
      'Fake profile',
      'Other',
    ];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Report ${_otherUser!.name}',
          style: GoogleFonts.dmSans(fontWeight: FontWeight.w600),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: reasons.map((reason) => ListTile(
            title: Text(reason, style: GoogleFonts.dmSans()),
            onTap: () {
              context.read<ChatProvider>().reportUser(_otherUserId!, reason);
              Navigator.pop(context);
              AppToasts.success(context, 'User reported');
            },
          )).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.dmSans(color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  void _showMoreOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.block, color: AppColors.pink),
              title: Text(
                'Block user',
                style: GoogleFonts.dmSans(color: AppColors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(context);
                _showBlockDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.report, color: AppColors.violet),
              title: Text(
                'Report user',
                style: GoogleFonts.dmSans(color: AppColors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(context);
                _showReportDialog();
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.textSecondary),
              title: Text(
                'Delete conversation',
                style: GoogleFonts.dmSans(color: AppColors.textPrimary),
              ),
              onTap: () {
                Navigator.pop(context);
                _showDeleteDialog();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          'Delete conversation?',
          style: GoogleFonts.dmSans(fontWeight: FontWeight.w600),
        ),
        content: Text(
          'This action cannot be undone.',
          style: GoogleFonts.dmSans(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancel',
              style: GoogleFonts.dmSans(color: AppColors.textSecondary),
            ),
          ),
          TextButton(
            onPressed: () {
              if (_conversationId != null) {
                context.read<ChatProvider>().deleteConversation(_conversationId!);
              }
              Navigator.pop(context);
              Navigator.pop(context);
              AppToasts.success(context, 'Conversation deleted');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.pink),
            child: Text(
              'Delete',
              style: GoogleFonts.dmSans(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatProvider = context.watch<ChatProvider>();
    final authProvider = context.watch<AuthProvider>();
    
    if (_conversationId == null) {
      return Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation: 0,
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.violet),
        ),
      );
    }

    final messages = chatProvider.getMessages(_conversationId!);
    final typingStatus = chatProvider.getTypingStatus(_conversationId!);
    final myUserId = authProvider.user?.id ?? '';
    final isOtherTyping = typingStatus[_otherUserId] ?? false;

    _scrollToBottomIfNeeded(messages.length);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_ios_new_rounded,
            color: AppColors.textSecondary,
            size: 18,
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0,
        title: _otherUser != null
            ? Row(
                children: [
                  _UserAvatar(user: _otherUser!),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _otherUser!.name,
                          style: GoogleFonts.dmSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          isOtherTyping
                              ? 'Typing...'
                              : (_otherUser!.isOnline
                                  ? 'Online'
                                  : _otherUser!.location ?? ''),
                          style: GoogleFonts.dmSans(
                            fontSize: 11,
                            color: isOtherTyping
                                ? AppColors.violet
                                : (_otherUser!.isOnline
                                    ? AppColors.emerald
                                    : AppColors.textMuted),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : const SizedBox(),
        actions: [
          IconButton(
            icon: const Icon(
              Icons.more_horiz_rounded,
              color: AppColors.textSecondary,
              size: 20,
            ),
            onPressed: _showMoreOptions,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? _EmptyConversation(otherUser: _otherUser)
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      final fromMe = message.senderId == myUserId;
                      return _MessageBubble(
                        message: message,
                        fromMe: fromMe,
                      );
                    },
                  ),
          ),
          _InputBar(
            controller: _controller,
            onSend: _send,
            onSendImage: _sendImage,
            onTyping: (isTyping) {
              if (_conversationId != null) {
                chatProvider.setTypingStatus(_conversationId!, isTyping);
              }
            },
          ),
        ],
      ),
    );
  }
}

class _EmptyConversation extends StatelessWidget {
  final AppUser? otherUser;

  const _EmptyConversation({required this.otherUser});

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
              child: otherUser != null
                  ? _UserAvatar(user: otherUser!, size: 80)
                  : const Icon(
                      Icons.chat_bubble_outline_rounded,
                      size: 40,
                      color: AppColors.violet,
                    ),
            ),
            const SizedBox(height: 20),
            Text(
              otherUser != null
                  ? 'Start chatting with ${otherUser!.name}'
                  : 'Start chatting',
              style: GoogleFonts.fraunces(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 10),
            Text(
              'Say hello and break the ice! 👋',
              style: GoogleFonts.dmSans(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool fromMe;

  const _MessageBubble({
    required this.message,
    required this.fromMe,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Align(
        alignment: fromMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.72,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: fromMe ? AppColors.violet : AppColors.surfaceHigh,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18),
              topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(fromMe ? 18 : 4),
              bottomRight: Radius.circular(fromMe ? 4 : 18),
            ),
            border: fromMe
                ? null
                : Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            crossAxisAlignment:
                fromMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              if (message.type == MessageType.image && message.imageUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: SignedPhotoImage(
                    path: message.imageUrl!,
                    fit: BoxFit.cover,
                    cacheWidth: 400,
                  ),
                )
              else
                Text(
                  message.content,
                  style: GoogleFonts.dmSans(
                    fontSize: 14,
                    color: fromMe ? Colors.white : AppColors.textPrimary,
                    height: 1.5,
                  ),
                ),
              const SizedBox(height: 3),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _formatTime(message.createdAt),
                    style: GoogleFonts.dmSans(
                      fontSize: 10,
                      color: fromMe
                          ? Colors.white.withValues(alpha: 0.55)
                          : AppColors.textMuted,
                    ),
                  ),
                  if (fromMe) ...[
                    const SizedBox(width: 4),
                    Icon(
                      message.isRead ? Icons.done_all : Icons.done,
                      size: 12,
                      color: message.isRead
                          ? Colors.white.withValues(alpha: 0.8)
                          : Colors.white.withValues(alpha: 0.4),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    return DateFormat('HH:mm').format(dateTime);
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback onSendImage;
  final ValueChanged<bool> onTyping;

  const _InputBar({
    required this.controller,
    required this.onSend,
    required this.onSendImage,
    required this.onTyping,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      padding: EdgeInsets.only(
        left: 16,
        right: 12,
        top: 10,
        bottom: MediaQuery.of(context).viewInsets.bottom + 10,
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            GestureDetector(
              onTap: onSendImage,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.surfaceHigh,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.border),
                ),
                child: const Icon(
                  Icons.image_outlined,
                  color: AppColors.violet,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: TextField(
                controller: controller,
                textCapitalization: TextCapitalization.sentences,
                style: GoogleFonts.dmSans(
                  fontSize: 15,
                  color: AppColors.textPrimary,
                ),
                onChanged: (text) {
                  onTyping(text.isNotEmpty);
                },
                decoration: InputDecoration(
                  hintText: 'Write a message…',
                  hintStyle: GoogleFonts.dmSans(
                    color: AppColors.textMuted,
                    fontSize: 15,
                  ),
                  filled: true,
                  fillColor: AppColors.surfaceHigh,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 18,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(
                      color: AppColors.border,
                      width: 1,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(
                      color: AppColors.violet,
                      width: 1.5,
                    ),
                  ),
                ),
                onSubmitted: (_) => onSend(),
              ),
            ),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: onSend,
              child: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.violet,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.violet.withValues(alpha: 0.40),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.send_rounded,
                  color: Colors.white,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UserAvatar extends StatelessWidget {
  final AppUser user;
  final double size;

  const _UserAvatar({required this.user, this.size = 38});

  @override
  Widget build(BuildContext context) {
    final hasPhoto = user.photos != null && user.photos!.isNotEmpty;
    final photoUrl = hasPhoto ? user.photos!.first : null;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.violet.withValues(alpha: 0.12),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.borderLight,
          width: 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: photoUrl != null
          ? SignedPhotoImage(
              path: photoUrl,
              fit: BoxFit.cover,
            )
          : Center(
              child: Text(
                user.name.substring(0, 1).toUpperCase(),
                style: GoogleFonts.dmSans(
                  fontSize: size * 0.5,
                  fontWeight: FontWeight.bold,
                  color: AppColors.violet,
                ),
              ),
            ),
    );
  }
}
