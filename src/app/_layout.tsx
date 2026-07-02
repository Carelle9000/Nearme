import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/auth-context';
import { PremiumProvider } from '../context/premium-context';
import { DiscoverProvider } from '../context/discover-context';
import { DiscoverFiltersProvider } from '../context/discover-filters-context';
import { ChatProvider } from '../context/chat-context';
import { ProfileProvider } from '../context/profile-context';
import { NotificationProvider } from '../context/notification-context';
import { LocalizationProvider } from '../context/localization-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocalizationProvider>
        <AuthProvider>
          <PremiumProvider>
            <NotificationProvider>
              <ProfileProvider>
                <DiscoverFiltersProvider>
                  <DiscoverProvider>
                    <ChatProvider>
                      <Slot />
                    </ChatProvider>
                  </DiscoverProvider>
                </DiscoverFiltersProvider>
              </ProfileProvider>
            </NotificationProvider>
          </PremiumProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
