import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Master App CRM' }} />
        <Stack.Screen name="project/[id]" options={{ title: 'Project Details' }} />
        <Stack.Screen name="task/[id]" options={{ title: 'Task Details' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      </Stack>
    </AuthProvider>
  );
}
