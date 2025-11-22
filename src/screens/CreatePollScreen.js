import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

const CreatePollScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Inicia con 2 opciones
  const [isLoading, setIsLoading] = useState(false);

  // Función para manejar el cambio de texto en una opción
  const handleOptionChange = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  // Función para añadir una nueva opción vacía
  const addOption = () => {
    if (options.length < 5) { // Limita a 5 opciones
        setOptions([...options, '']);
    } else {
        Alert.alert("Limit Reached", "You can add a maximum of 5 options.");
    }
  };

  // Función para quitar la última opción
  const removeOption = (index) => {
    if (options.length > 2) { // Mantiene un mínimo de 2 opciones
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    }
  };

  // Función para guardar la encuesta en Firestore
  const handleCreatePoll = async () => {
    if (question.trim() === '') {
      Alert.alert('Error', 'Please enter a question for the poll.');
      return;
    }

    const filledOptions = options.map(o => o.trim()).filter(o => o !== '');
    if (filledOptions.length < 2) {
      Alert.alert('Error', 'You must provide at least two non-empty options.');
      return;
    }

    setIsLoading(true);
    try {
      await firestore()
        .collection('teams')
        .doc(teamId)
        .collection('polls')
        .add({
          question: question.trim(),
          options: filledOptions,
          votes: {},
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      Alert.alert('Success', 'Poll created successfully.');
      navigation.goBack();
    } catch (error) {
      console.error("Error creating poll: ", error);
      Alert.alert('Error', 'Could not create the poll.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.header}>Create a New Poll</Text>
        
        <Text style={styles.label}>Question</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., What day is best for practice?"
          value={question}
          onChangeText={setQuestion}
        />

        <Text style={styles.label}>Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              placeholder={`Option ${index + 1}`}
              value={option}
              onChangeText={(text) => handleOptionChange(text, index)}
            />
            {options.length > 2 && (
              <TouchableOpacity onPress={() => removeOption(index)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>-</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addOption}>
            <Text style={styles.addButtonText}>+ Add Option</Text>
        </TouchableOpacity>
        
        <View style={styles.createButtonContainer}>
            <Button
            title={isLoading ? "Creating..." : "Create Poll"}
            onPress={handleCreatePoll}
            disabled={isLoading}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    form: { padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
    label: { fontSize: 16, color: '#4b5563', marginBottom: 8, marginTop: 10 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, },
    optionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    optionInput: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, },
    removeButton: { marginLeft: 10, backgroundColor: '#ef4444', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    removeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    addButton: { backgroundColor: '#e5e7eb', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 5 },
    addButtonText: { color: '#4b5563', fontWeight: '600' },
    createButtonContainer: { marginTop: 30 }
});

export default CreatePollScreen;