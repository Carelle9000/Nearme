import { View, Text, StyleSheet } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>💬 Chat Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#000',
  },
  placeholder: {
    padding: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 24,
    textAlign: 'center',
  },
});
