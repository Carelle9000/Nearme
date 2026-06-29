import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { AuthProvider } from '../context/auth-context';
import { DiscoverProvider } from '../context/discover-context';
import { ChatProvider } from '../context/chat-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DiscoverProvider>
          <ChatProvider>
            {/* Routes will be managed by auth state in index.tsx */}
          </ChatProvider>
        </DiscoverProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
