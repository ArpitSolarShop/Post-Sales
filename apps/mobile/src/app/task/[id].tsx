import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function TaskDetailScreen() {
  const { id, title, desc, projectId, customerName } = useLocalSearchParams();
  const { token, user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);

  const handleCompleteTask = async () => {
    setLoading(true);
    try {
      if (!token) return;
      const response = await fetch(`http://192.168.1.40:3001/workflow/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId: user?.id || 'demo-employee' 
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Task marked as completed!");
        router.back();
      } else {
        Alert.alert("Error", "Failed to complete task.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = () => {
    if (projectId) {
      router.push(`/project/${projectId}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task Details</Text>
      
      <View style={styles.card}>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.customerName}>{customerName || 'No Customer Assigned'}</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.label}>Description</Text>
        <Text style={styles.desc}>{desc || 'No description provided.'}</Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleCompleteTask}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Mark as Completed ✓</Text>
          )}
        </TouchableOpacity>

        {projectId && (
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleViewProject}
          >
            <Text style={styles.secondaryButtonText}>View Project Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  customerName: {
    fontSize: 14,
    color: '#3182CE',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#718096',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#48BB78',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#EDF2F7',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#4A5568',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
