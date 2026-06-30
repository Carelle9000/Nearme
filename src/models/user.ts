export interface AppUser {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  photos?: string[];
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  interests?: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
  verified: boolean;
  isAgeVerified?: boolean;
  stripeIdentitySessionId?: string;
  lastSeen?: Date;
}

export interface Profile {
  uid: string;
  name: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  birthDate?: string; // ISO string
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  interests?: string[];
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  photos?: string[];
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  verified: boolean;
  isAgeVerified?: boolean;
  stripeIdentitySessionId?: string;
  lastSeen?: string; // ISO string
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'system';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  createdAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface Match {
  id: string;
  users: string[];
  matchedAt: Date;
  lastInteractionAt?: Date;
}

export interface Like {
  targetId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'match' | 'message' | 'system';
  relatedUserId?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}
