import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CreateCompetitionScreen = ({ navigation }) => {
  const [competitionName, setCompetitionName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateCompetition = async () => {
    if (competitionName.trim() === '') {
      Alert.alert('Error', 'Please enter a name for the competition.');
      return;
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setLoading(true);

    try {
      // 1. Usar un batch para ambas operaciones
      const batch = firestore().batch();
      
      // 2. Crear la competencia
      const competitionRef = firestore().collection('competitions').doc();
      const competitionId = competitionRef.id;
      const inviteCode = `${competitionName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const competitionData = {
        name: competitionName.trim(),
        organizerId: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        inviteCode: inviteCode,
        competitionId: competitionId
      };
      batch.set(competitionRef, competitionData);

      // 3. Actualizar el perfil del usuario
      const userRef = firestore().collection('users').doc(currentUser.uid);
      batch.update(userRef, {
        competitionId: competitionId,
      });

      // 4. Ejecutar
      await batch.commit();
      
      // --- ¡AQUÍ ESTÁ EL CAMBIO! ---
      Alert.alert(
        'Success!', 
        `Competition "${competitionName}" created.`,
        [
          { 
            text: 'OK', 
            onPress: () => {
              // 5. Navegamos al panel de control principal
              // (App.tsx verá el nuevo competitionId y nos mostrará el dashboard)
              navigation.reset({
                index: 0,
                routes: [{ name: 'OrganizerRoot' }],
              });
            }
          }
        ]
      );
      // --- FIN DEL CAMBIO ---

    } catch (error) {
      console.error("Error creating competition: ", error);
      Alert.alert('Error', 'Could not create the competition.');
      setLoading(false); // Solo paramos el loading si hay error
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Competition</Text>
        <Text style={styles.subtitle}>Give your new competition a name.</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g., Liga de Verano 2026"
          value={competitionName}
          onChangeText={setCompetitionName}
          autoCapitalize="words"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button 
            title="Create Competition" 
            onPress={handleCreateCompetition} 
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// ... (Los estilos se quedan igual)
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
      },
      content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
      },
      title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 8,
      },
      subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
      },
      input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 24,
      },
});

export default CreateCompetitionScreen;