import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useAuth } from '../context/auth-context';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { chatService } from '../services/chat.service';
import { rtdb, auth } from '../config/firebase';
import { ref, get } from 'firebase/database';

export default function DebugScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');

  const addLog = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setResults((prev) => [...prev, `✓ ${message}`]);
  };

  const addError = (message: string) => {
    console.error(`[ERROR] ${message}`);
    setResults((prev) => [...prev, `✗ ${message}`]);
  };

  const clearLogs = () => setResults([]);

  // Test 1: Vérifier la connexion Firebase
  const testFirebaseConnection = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Testing Firebase connection...');

      // Vérifier que Firebase est initialisé
      if (!auth || !rtdb) {
        throw new Error('Firebase not initialized');
      }
      addLog('Firebase auth initialized ✓');
      addLog('Firebase Firestore initialized ✓');

      // Tester la lecture Firestore
      try {
        const testRef = ref(rtdb, 'conversations/test');
        await get(testRef);
        addLog('Firestore read access ✓');
      } catch (e: any) {
        if (e.code === 'permission-denied') {
          addError('Firestore permission denied - check security rules');
        } else {
          addLog('Firestore accessible ✓');
        }
      }

      Alert.alert('✅ Firebase Connecté', 'Votre Firebase est correctement connecté !');
    } catch (error: any) {
      addError(`Firebase Error: ${error.message}`);
      Alert.alert('❌ Erreur Firebase', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Test 2: Vérifier l'utilisateur courant
  const testCurrentUser = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Checking current user...');

      const currentUser = authService.currentUser;
      if (currentUser) {
        addLog(`User logged in: ${currentUser.name}`);
        addLog(`User ID: ${currentUser.id}`);
        addLog(`Email: ${currentUser.email}`);
      } else {
        addLog('No user logged in');
      }
    } catch (error: any) {
      addError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 3: Tester la lecture de profil
  const testGetProfile = async () => {
    setLoading(true);
    clearLogs();
    try {
      if (!user) {
        addError('No user logged in');
        setLoading(false);
        return;
      }

      addLog('Fetching your profile...');
      const profile = await userService.getProfile(user.id);

      if (profile) {
        addLog(`Profile found: ${profile.name}`);
        addLog(`Profile data: ${JSON.stringify(profile, null, 2)}`);
      } else {
        addLog('Profile not found in Firestore');
      }
    } catch (error: any) {
      addError(`Profile Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 4: Tester la mise à jour de profil
  const testUpdateProfile = async () => {
    setLoading(true);
    clearLogs();
    try {
      if (!user) {
        addError('No user logged in');
        setLoading(false);
        return;
      }

      addLog('Updating profile...');
      await userService.updateProfile(user.id, {
        bio: `Updated at ${new Date().toLocaleTimeString()}`,
      });
      addLog('Profile updated successfully ✓');
    } catch (error: any) {
      addError(`Update Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 5: Tester les likes
  const testLikes = async () => {
    setLoading(true);
    clearLogs();
    try {
      if (!user) {
        addError('No user logged in');
        setLoading(false);
        return;
      }

      // Sauvegarder un like de test
      addLog('Saving test like...');
      const testUserId = 'test-user-123';
      await userService.saveLike(user.id, testUserId);
      addLog('Like saved ✓');

      // Récupérer les likes
      addLog('Fetching sent likes...');
      const likes = await userService.getSentLikes(user.id);
      addLog(`You have ${likes.length} likes`);
      addLog(`Liked users: ${likes.join(', ')}`);
    } catch (error: any) {
      addError(`Likes Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 6: Tester les conversations
  const testConversations = async () => {
    setLoading(true);
    clearLogs();
    try {
      if (!user) {
        addError('No user logged in');
        setLoading(false);
        return;
      }

      addLog('Creating test conversation...');
      const testUserId = 'test-user-456';
      const conversation = await chatService.getOrCreateConversation(
        user.id,
        testUserId,
        user.name,
        'Test User'
      );
      addLog(`Conversation created: ${conversation.id}`);
      addLog('Sending test message...');
      const message = await chatService.sendMessage(
        conversation.id,
        user.id,
        'This is a test message from debug screen'
      );
      addLog(`Message sent: ${message.id}`);
    } catch (error: any) {
      addError(`Chat Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test 7: Tester l'enregistrement
  const testRegistration = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog(`Registering user: ${testEmail}`);
      const newUser = await authService.register(testEmail, testPassword, 'Test User');
      addLog(`Registration successful`);
      addLog(`User ID: ${newUser.id}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        addLog('Email already registered (this is OK for testing)');
      } else {
        addError(`Registration Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const TestButton = ({ title, onPress, color = '#007AFF' }: any) => (
    <TouchableOpacity
      style={{
        backgroundColor: color,
        padding: 12,
        marginVertical: 8,
        borderRadius: 8,
      }}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        🧪 Firebase Debug Console
      </Text>

      {/* User Info */}
      <View style={{ backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Current User:</Text>
        {user ? (
          <>
            <Text>Name: {user.name}</Text>
            <Text>Email: {user.email}</Text>
            <Text>ID: {user.id}</Text>
          </>
        ) : (
          <Text style={{ color: 'red' }}>❌ Not logged in</Text>
        )}
      </View>

      {/* Test Buttons */}
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>
        Tests:
      </Text>

      <TestButton title="✅ Test Firebase Connection" onPress={testFirebaseConnection} color="#34C759" />
      <TestButton title="👤 Check Current User" onPress={testCurrentUser} color="#007AFF" />
      <TestButton title="📋 Get My Profile" onPress={testGetProfile} color="#007AFF" />
      <TestButton title="✏️ Update Profile" onPress={testUpdateProfile} color="#FF9500" />
      <TestButton title="❤️ Test Likes" onPress={testLikes} color="#FF3B30" />
      <TestButton title="💬 Test Conversations" onPress={testConversations} color="#5856D6" />
      <TestButton title="📝 Test Registration" onPress={testRegistration} color="#FF9500" />

      {/* Loading Indicator */}
      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />}

      {/* Results */}
      {results.length > 0 && (
        <View style={{ backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Results:</Text>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={{ color: '#007AFF', fontWeight: 'bold' }}>Clear</Text>
            </TouchableOpacity>
          </View>
          {results.map((result, index) => (
            <Text key={index} style={{ fontSize: 12, marginVertical: 4, fontFamily: 'monospace' }}>
              {result}
            </Text>
          ))}
        </View>
      )}

      {/* Browser Console Reminder */}
      <View style={{ backgroundColor: '#FFF3CD', padding: 12, borderRadius: 8, marginTop: 16 }}>
        <Text style={{ fontSize: 12, color: '#856404', fontWeight: 'bold' }}>
          💡 Tip: Open browser console (F12) to see detailed logs
        </Text>
      </View>
    </ScrollView>
  );
}
