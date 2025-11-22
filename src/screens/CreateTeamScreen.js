// src/screens/CreateTeamScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator // <-- Importar ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CreateTeamScreen = ({ navigation }) => {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false); // <-- Añadir estado de carga

  const handleCreateTeam = async () => {
    const trimmedTeamName = teamName.trim(); // <-- Usar nombre sin espacios extra
    if (trimmedTeamName === '') {
      Alert.alert('Error', 'Please enter a team name.');
      return;
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a team.');
      return;
    }

    setLoading(true); // <-- Iniciar carga

    try {
      const teamRef = firestore().collection('teams').doc();
      const userRef = firestore().collection('users').doc(currentUser.uid);
      // El código de invitación general del equipo ya no se crea aquí

      const batch = firestore().batch();

      // Operación A: Crear el equipo
      batch.set(teamRef, {
        teamName: trimmedTeamName, // <-- Usar nombre sin espacios extra
        managerId: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Operación B: Actualizar el documento del usuario añadiendo el ID del equipo
      batch.update(userRef, {
        // role: 'manager', // El rol ya se debe haber asignado en RoleSelectScreen
        teams: firestore.FieldValue.arrayUnion(teamRef.id), // Añade el ID del nuevo equipo al array
      });

      await batch.commit();
      console.log("Team created and user profile updated successfully.");

      Alert.alert('Success!', `Team "${trimmedTeamName}" created successfully.`);

      // --- ¡NAVEGACIÓN CORREGIDA! ---
      // Reseteamos la navegación al stack principal del Manager.
      // App.tsx ahora debería detectar el array 'teams' y dirigir correctamente.
      navigation.reset({
        index: 0,
        routes: [{ name: 'ManagerRoot' }],
      });
      // --- FIN DE LA CORRECCIÓN ---

    } catch (error) {
      console.error("Error creating team: ", error);
      Alert.alert('Error', 'Could not create the team.');
      setLoading(false); // <-- Detener carga en caso de error
    }
    // No setLoading(false) aquí si la navegación fue exitosa
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Team</Text>
        <Text style={styles.subtitle}>Give your new team a name.</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., Cerveceros"
          value={teamName}
          onChangeText={setTeamName}
          autoCapitalize="words"
          editable={!loading} // <-- Deshabilitar mientras carga
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <Button title="Create Team" onPress={handleCreateTeam} disabled={loading}/>
        )}
      </View>
    </SafeAreaView>
  );
};

// --- Estilos (sin cambios) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', },
    content: { flex: 1, justifyContent: 'center', padding: 24, },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8, },
    subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 24, },
});

export default CreateTeamScreen;