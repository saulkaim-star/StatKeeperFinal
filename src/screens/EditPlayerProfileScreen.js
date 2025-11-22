import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage'; 
import { launchImageLibrary } from 'react-native-image-picker'; 
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const EditPlayerProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Datos del jugador
  const [teamId, setTeamId] = useState(null);
  const [rosterDocId, setRosterDocId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [playerNumber, setPlayerNumber] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');

  // Para la foto
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);
  const [newImageUri, setNewImageUri] = useState(null); 
  const [newImageFileName, setNewImageFileName] = useState(null);

  // Cargar datos (Sin cambios)
  useFocusEffect(
    useCallback(() => {
      const loadPlayerData = async () => {
        setLoading(true);
        setError(null);
        try {
          const currentUser = auth().currentUser;
          if (!currentUser) throw new Error("Not authenticated");

          const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
          if (!userDoc.exists) throw new Error("User profile not found.");
          
          const currentTeamId = userDoc.data().teams?.[0] || userDoc.data().teamId;
          if (!currentTeamId) throw new Error("Team ID not found on user profile.");
          setTeamId(currentTeamId);

          const rosterSnap = await firestore().collection('teams').doc(currentTeamId).collection('roster')
                               .where('userId', '==', currentUser.uid).limit(1).get();
          if (rosterSnap.empty) throw new Error("Player profile not found in team roster.");

          const rosterDoc = rosterSnap.docs[0];
          const playerData = rosterDoc.data();

          setRosterDocId(rosterDoc.id);
          setPlayerName(playerData.playerName || playerData.name || '');
          setPlayerNumber(playerData.playerNumber || '');
          setPlayerPosition(playerData.playerPosition || '');
          setCurrentPhotoUrl(playerData.photoURL || null);
          setNewImageUri(null); 
          setNewImageFileName(null); 

        } catch (e) {
          console.error("Error loading player data:", e);
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      loadPlayerData();
    }, [])
  );

  // Función para seleccionar la foto (Sin cambios desde tu versión corregida)
  const handleSelectPhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
        Alert.alert('Error', 'Could not select image.');
      } else if (response.assets && response.assets.length > 0) {
        setNewImageUri(response.assets[0].uri);
        setNewImageFileName(response.assets[0].fileName || 'photo.jpg');
      }
    });
  };


  // Función para guardar los cambios (MODIFICADA)
  const handleSaveChanges = async () => {
    // La validación del nombre ya no es necesaria, ya que no se puede editar
    if (!rosterDocId || !teamId) {
      Alert.alert('Error', 'Could not find player profile to update.');
      return;
    }

    setSaving(true);
    let photoURL = currentPhotoUrl; 

    try {
      // --- Paso 1: Subir la foto nueva (si existe) ---
      if (newImageUri && newImageFileName) { 
        console.log('Uploading new photo...');
        const currentUser = auth().currentUser;
        
        const fileExtension = newImageFileName.split('.').pop(); 
        const fileName = `${currentUser.uid}.${fileExtension}`; 
        const storageRef = storage().ref(`profile_photos/${fileName}`);
        
        await storageRef.putFile(newImageUri);
        photoURL = await storageRef.getDownloadURL();
        console.log('Photo uploaded, URL:', photoURL);
      }

      // --- Paso 2: Actualizar el documento del Roster en Firestore ---
      // --- INICIO DE LA CORRECCIÓN ---
      // Se elimina 'playerName' del objeto de actualización.
      const dataToUpdate = {
        playerNumber: playerNumber,
        playerPosition: playerPosition,
        photoURL: photoURL, 
      };
      // --- FIN DE LA CORRECCIÓN ---

      await firestore().collection('teams').doc(teamId).collection('roster')
                       .doc(rosterDocId).update(dataToUpdate);

      setSaving(false);
      Alert.alert('Success', 'Your profile has been updated.');
      navigation.goBack(); 

    } catch (e) {
      setSaving(false);
      console.error("Error saving profile:", e);
      Alert.alert('Error', 'An error occurred while saving your profile.');
    }
  };

  // --- Renderizado (MODIFICADO) ---
  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }
  const displayImageUri = newImageUri || currentPhotoUrl;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Your Profile</Text>

        <TouchableOpacity style={styles.photoContainer} onPress={handleSelectPhoto}>
          {displayImageUri ? (
            <Image source={{ uri: displayImageUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderText}>Select Photo</Text>
            </View>
          )}
          <View style={styles.photoEditIcon}>
            <Text>✏️</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Player Name</Text>
        <TextInput
          // --- INICIO DE LA CORRECCIÓN ---
          style={[styles.input, styles.disabledInput]} // <-- Se añade estilo de deshabilitado
          value={playerName}
          onChangeText={setPlayerName}
          placeholder="Your full name"
          editable={false} // <-- ¡LA CLAVE!
          // --- FIN DE LA CORRECCIÓN ---
        />
        <Text style={styles.labelMuted}>
          Your name can only be changed by your team manager to ensure stats are tracked correctly.
        </Text>


        <Text style={styles.label}>Jersey Number</Text>
        <TextInput
          style={styles.input}
          value={playerNumber}
          onChangeText={setPlayerNumber}
          placeholder="e.g., 23"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Primary Position</Text>
        <TextInput
          style={styles.input}
          value={playerPosition}
          onChangeText={setPlayerPosition}
          placeholder="e.g., Pitcher, Shortstop"
          autoCapitalize="words"
        />

        <View style={styles.buttonContainer}>
          {saving ? (
            <ActivityIndicator size="large" color="#3b82f6" />
          ) : (
            <Button title="Save Changes" onPress={handleSaveChanges} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Estilos (MODIFICADOS) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 24 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e5e7eb' },
  photoPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: { color: '#6b7280' },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: '30%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  label: { fontSize: 16, color: '#4b5563', marginBottom: 5, marginTop: 10 },
  labelMuted: { // <-- NUEVO ESTILO
    fontSize: 12, 
    color: '#6b7280', 
    marginTop: -12, 
    marginBottom: 16, 
    fontStyle: 'italic'
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  disabledInput: { // <-- NUEVO ESTILO
    backgroundColor: '#f3f4f6', 
    color: '#6b7280',
    borderColor: '#e5e7eb',
  },
  buttonContainer: { marginTop: 20 },
});

export default EditPlayerProfileScreen;