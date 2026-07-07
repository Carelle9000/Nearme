import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { AuthProvider } from '@/context/auth-context';
import { PremiumProvider } from '@/context/premium-context';
import { DiscoverProvider } from '@/context/discover-context';
import { DiscoverFiltersProvider } from '@/context/discover-filters-context';
import { ChatProvider } from '@/context/chat-context';
import { ProfileProvider } from '@/context/profile-context';
import { NotificationProvider } from '@/context/notification-context';
import { LocalizationProvider } from '@/context/localization-context';
import { ToastProvider } from '@/context/toast-context';
import { ToastContainer } from '@/components/ToastContainer';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LocalizationProvider>
        <ToastProvider>
          <AuthProvider>
            <PremiumProvider>
              <NotificationProvider>
                <ProfileProvider>
                  <DiscoverFiltersProvider>
                    <DiscoverProvider>
                      <ChatProvider>
                        <View style={{ flex: 1 }}>
                          <Slot />
                          <ToastContainer />
                        </View>
                      </ChatProvider>
                    </DiscoverProvider>
                  </DiscoverFiltersProvider>
                </ProfileProvider>
              </NotificationProvider>
            </PremiumProvider>
          </AuthProvider>
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
