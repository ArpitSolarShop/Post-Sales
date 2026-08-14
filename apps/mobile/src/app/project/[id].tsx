import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const router = useRouter();
  
  const [plantStatus, setPlantStatus] = useState('');
  const [surveyStatus, setSurveyStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      if (!token) return;
      const response = await fetch(`http://192.168.1.40:3001/crm/projects/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          plantStatus,
          surveyStatus
        })
      });

      if (response.ok) {
        Alert.alert("Success", "Project status updated securely!");
        router.back();
      } else {
        Alert.alert("Error", "Failed to update status.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Update Project Status</Text>
      <Text style={styles.subtitle}>Project ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Plant Status (e.g., Installed, Pending)</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter plant status..."
          value={plantStatus}
          onChangeText={setPlantStatus}
        />

        <Text style={styles.label}>Survey Status</Text>
        <TextInput 
          style={styles.input}
          placeholder="Enter survey status..."
          value={surveyStatus}
          onChangeText={setSurveyStatus}
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Changes to CRM</Text>
          )}
        </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 24,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#F7FAFC',
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
  }
});
