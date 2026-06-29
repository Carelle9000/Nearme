import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/auth-context';
import { DiscoverProvider } from '../context/discover-context';
import { DiscoverFiltersProvider } from '../context/discover-filters-context';
import { ChatProvider } from '../context/chat-context';
import { ProfileProvider } from '../context/profile-context';
import { NotificationProvider } from '../context/notification-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <NotificationProvider>
          <ProfileProvider>
            <DiscoverProvider>
              <DiscoverFiltersProvider>
                <ChatProvider>
                  {/* Routes will be managed by auth state in index.tsx */}
                </ChatProvider>
              </DiscoverFiltersProvider>
            </DiscoverProvider>
          </ProfileProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
