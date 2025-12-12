// components/CreateMediaPostScreen.js

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

// (Opcional) Si quieres un reproductor de video para la vista previa
// npm install react-native-video
// import Video from 'react-native-video';

const CreateMediaPostScreen = ({ route, navigation }) => {

  // --- ¡¡CAMBIO 1!! ---
  // Ahora recibimos 'teamId' Y 'competitionId'
  const { teamId, competitionId } = route.params;
  // --- FIN CAMBIO 1 ---

  const currentUser = auth().currentUser;

  const [mediaAsset, setMediaAsset] = useState(null); // Guarda el 'asset' (foto/video)
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- 1. Lógica para Seleccionar Media ---
  const handleSelectMedia = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed', // Permite fotos Y videos
        videoQuality: 'high',
      },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
          return;
        }

        const asset = response.assets[0];

        // --- ¡VALIDACIÓN DE 50 SEGUNDOS! ---
        if (asset.type.startsWith('video') && asset.duration > 50) {
          Alert.alert(
            "Video Too Long",
            "Please select a video that is 50 seconds or less."
          );
          return; // Detenemos
        }
        // --- FIN DE VALIDACIÓN ---

        setMediaAsset(asset); // Guardamos el asset seleccionado
      }
    );
  };

  // --- 2. Lógica para Subir el Post ---
  const handleUploadPost = async () => {
    if (!mediaAsset) {
      Alert.alert('No Media', 'Please select a photo or video to post.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    const postId = firestore().collection('mediaPosts').doc().id;
    const fileType = mediaAsset.type.startsWith('video') ? 'video' : 'photo';
    const fileName = mediaAsset.fileName || `media_${postId}`;
    const storagePath = `media_posts/${currentUser.uid}/${postId}/${fileName}`;

    const reference = storage().ref(storagePath);

    // 1. Subir el archivo a Storage
    const task = reference.putFile(mediaAsset.uri);

    task.on('state_changed', (snapshot) => {
      // Actualizar el progreso
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      setUploadProgress(Math.round(progress));
    });

    try {
      // Esperar a que la subida termine
      await task;

      // 2. Obtener la URL de descarga
      const mediaUrl = await reference.getDownloadURL();

      // 3. Guardar el post en Firestore
      await firestore().collection('mediaPosts').doc(postId).set({
        caption: caption,
        mediaUrl: mediaUrl,
        type: fileType,
        userId: currentUser.uid,
        teamId: teamId,

        // --- ¡¡CAMBIO 2!! ---
        // Aquí guardamos el 'competitionId' en la base de datos
        competitionId: competitionId,
        // --- FIN CAMBIO 2 ---

        createdAt: firestore.FieldValue.serverTimestamp(),
        likes: [], // (Para el futuro)
      });

      setLoading(false);
      Alert.alert('Post Created!', 'Your media has been shared successfully.');
      navigation.goBack();

    } catch (error) {
      setLoading(false);
      console.error("Upload Error: ", error);
      Alert.alert('Upload Failed', 'An error occurred while uploading your media.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create New Post</Text>

        {/* --- Vista Previa de Media --- */}
        {mediaAsset ? (
          <View style={styles.mediaPreview}>
            {mediaAsset.type.startsWith('image') ? (
              <Image source={{ uri: mediaAsset.uri }} style={styles.image} resizeMode="contain" />
            ) : (
              // <Video source={{ uri: mediaAsset.uri }} style={styles.image} controls={true} />
              <Text style={styles.videoText}>Video selected: {mediaAsset.fileName}</Text>
            )}
            <TouchableOpacity style={styles.removeButton} onPress={() => setMediaAsset(null)}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.selectButton} onPress={handleSelectMedia}>
            <Text style={styles.selectButtonText}>Select Photo or Video</Text>
          </TouchableOpacity>
        )}

        {/* --- Campo de Texto --- */}
        <TextInput
          style={styles.input}
          placeholder="Write a caption..."
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        {/* --- Botón de Subir --- */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.postButton} onPress={handleUploadPost}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- (Todos tus estilos se quedan igual) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, textAlign: 'center' },
  selectButton: {
    backgroundColor: '#e5e7eb',
    height: 200,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
  },
  selectButtonText: { fontSize: 16, color: '#4b5563', fontWeight: '500' },
  mediaPreview: {
    height: 300,
    marginBottom: 20,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#000',
  },
  videoText: { padding: 20, textAlign: 'center', color: '#6b7280' },
  removeButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'red',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  removeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  progressText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3b82f6',
  },
});

export default CreateMediaPostScreen;