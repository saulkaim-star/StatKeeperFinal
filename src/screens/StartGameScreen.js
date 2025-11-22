import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const StartGameScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [opponentName, setOpponentName] = useState('');
  const [location, setLocation] = useState('');
  const [locationStatus, setLocationStatus] = useState('home');

  const handleNextStep = () => {
    if (opponentName.trim() === '') {
      Alert.alert('Required', 'Please enter an opponent name.');
      return;
    }
    navigation.navigate('SelectLineup', { teamId, opponentName, location, locationStatus });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>New Game Setup</Text>
        <Text style={styles.label}>Opponent's Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Tigres"
          value={opponentName}
          onChangeText={setOpponentName}
          autoCapitalize="words"
        />
        <Text style={styles.label}>Your Team Is</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, locationStatus === 'home' && styles.toggleButtonActive]}
            onPress={() => setLocationStatus('home')}
          >
            <Text style={[styles.toggleButtonText, locationStatus === 'home' && styles.toggleButtonTextActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, locationStatus === 'away' && styles.toggleButtonActive]}
            onPress={() => setLocationStatus('away')}
          >
            <Text style={[styles.toggleButtonText, locationStatus === 'away' && styles.toggleButtonTextActive]}>Away</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Location (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Central Park Field #2"
          value={location}
          onChangeText={setLocation}
          autoCapitalize="words"
        />
        <Button title="Next: Select Lineup" onPress={handleNextStep} />
      </View>
    </SafeAreaView>
  );
};

// ... (los estilos se quedan igual)
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f7fa' }, content: { flex: 1, padding: 24, }, title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 32, }, label: { fontSize: 16, color: '#4b5563', marginBottom: 8, }, input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 24, }, toggleContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginBottom: 24, overflow: 'hidden', }, toggleButton: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: 'white', }, toggleButtonActive: { backgroundColor: '#3b82f6', }, toggleButtonText: { fontSize: 16, color: '#374151', }, toggleButtonTextActive: { color: 'white', fontWeight: 'bold', }, });

export default StartGameScreen;