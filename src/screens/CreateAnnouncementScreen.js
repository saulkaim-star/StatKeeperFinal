import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const CreateAnnouncementScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (text.trim() === '') {
      Alert.alert('Error', 'Announcement text cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      await firestore().collection('teams').doc(teamId).collection('announcements').add({
        text: text,
        authorId: auth().currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not post announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.header}>New Announcement</Text>
        <TextInput
          style={styles.input}
          placeholder="Write your message to the team..."
          value={text}
          onChangeText={setText}
          multiline
        />
        {loading ? <ActivityIndicator/> : <Button title="Post to Team" onPress={handlePost} />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  form: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { height: 150, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 5, marginBottom: 20, textAlignVertical: 'top', fontSize: 16 },
});

export default CreateAnnouncementScreen;