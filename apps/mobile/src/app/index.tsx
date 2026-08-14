import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function TechnicianDashboard() {
  const { user, token, isLoading: authLoading, login, logout } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.40:3000'; // Changed to 3000 (NestJS)
      const response = await fetch(`${backendUrl}/workflow/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const onSignInPress = async () => {
    setIsSubmitting(true);
    const success = await login(emailAddress, password);
    setIsSubmitting(false);
    if (!success) {
      Alert.alert("Error", "Invalid email or password");
    }
  };

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3182CE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!user ? (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.center}
        >
          <View style={styles.authCard}>
            <Text style={styles.title}>Solar CRM</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Email..."
              onChangeText={setEmailAddress}
            />
            <TextInput
              style={styles.input}
              value={password}
              placeholder="Password..."
              secureTextEntry={true}
              onChangeText={setPassword}
            />
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={onSignInPress}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <>
          {user.isActive ? (
            <>
              <View style={styles.header}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.title}>My Tasks</Text>
                  <TouchableOpacity onPress={logout} style={{padding: 8}}>
                    <Text style={{color: '#E53E3E', fontWeight: 'bold'}}>Logout</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.subtitle}>Welcome back, {user.name || user.email}</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#3182CE" style={{marginTop: 20}} />
              ) : (
                <FlatList
                  data={tasks}
                  keyExtractor={(item: any) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.card}
                      onPress={() => router.push({
                        pathname: `/task/${item.id}`,
                        params: { 
                          title: item.title, 
                          desc: item.description, 
                          projectId: item.projectId,
                          customerName: item.project?.customer?.name 
                        }
                      })}
                    >
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardSubtitle}>{item.project?.customer?.name} • {item.project?.customer?.location}</Text>
                      <View style={styles.tagContainer}>
                        <Text style={styles.tag}>Priority: {item.priority}</Text>
                        <Text style={styles.tag}>Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={<Text style={styles.emptyText}>No tasks assigned yet.</Text>}
                  contentContainerStyle={styles.listContainer}
                  refreshing={loading}
                  onRefresh={fetchTasks}
                />
              )}
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.title}>Approval Pending</Text>
              <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 12, paddingHorizontal: 20 }]}>
                Your account is waiting for an administrator to approve your access.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => fetchTasks()}>
                <Text style={styles.buttonText}>Refresh Status</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor: 'gray', marginTop: 12}]} onPress={logout}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  authCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    padding: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F7FAFC',
    padding: 14,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3182CE',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: '#EBF4FF',
    color: '#3182CE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden'
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginTop: 40,
  }
});
