import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (!token) return;
      // For now we pass a dummy ID or clerk user ID.
      // Wait, let's just fetch all notifications for the demo if there's no mapping yet
      const response = await fetch(`http://192.168.1.40:3001/workflow/notifications/demo-employee`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markRead = async (id: string, actionUrl?: string) => {
    try {
      await fetch(`http://192.168.1.40:3001/workflow/notifications/${id}/read`, {
        method: 'PATCH'
      });
      if (actionUrl) {
        router.push(actionUrl as any);
      } else {
        fetchNotifications();
      }
    } catch (err) {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={{marginTop: 20}} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.card, item.isRead ? styles.readCard : null]}
              onPress={() => markRead(item.id, item.actionUrl)}
            >
              <Text style={styles.notifTitle}>{item.title}</Text>
              <Text style={styles.notifMessage}>{item.message}</Text>
              <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No notifications.</Text>}
          refreshing={loading}
          onRefresh={fetchNotifications}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  readCard: {
    borderLeftColor: '#CBD5E0',
    opacity: 0.7,
  },
  notifTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 4,
  },
  notifMessage: {
    color: '#4A5568',
    fontSize: 14,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
  },
  empty: {
    textAlign: 'center',
    color: '#718096',
    marginTop: 40,
  }
});
