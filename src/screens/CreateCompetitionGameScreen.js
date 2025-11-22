import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput, // --- AÑADIDO ---
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateCompetitionGameScreen = ({ route, navigation }) => {
  const { competitionId } = route.params || {};

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState(null);

  const [homeTeamId, setHomeTeamId] = useState(null);
  const [awayTeamId, setAwayTeamId] = useState(null);
  const [gameDate, setGameDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // --- AÑADIDO: Estado para la ubicación ---
  const [location, setLocation] = useState('');
  // --- FIN AÑADIDO ---

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!competitionId) {
      setError('Competition ID not provided.');
      setLoadingTeams(false);
      return;
    }

    setLoadingTeams(true);
    const subscriber = firestore()
      .collection('competition_teams')
      .where('competitionId', '==', competitionId)
      .onSnapshot(
        querySnapshot => {
          const teamsList = [];
          if (querySnapshot) {
            querySnapshot.forEach(doc => {
              const teamData = doc.data();
              teamsList.push({
                id: teamData.teamId, // ID del equipo
                name: teamData.teamName, // Nombre del equipo
              });
            });
          }
          setTeams(teamsList);
          setLoadingTeams(false);
        },
        err => {
          console.error("Error fetching teams for competition:", err);
          setError('Could not load teams.');
          setLoadingTeams(false);
        }
      );
    return () => subscriber();
  }, [competitionId]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    const currentDate = selectedDate || gameDate;
    setGameDate(currentDate);
    // Abre el selector de hora justo después de seleccionar la fecha
    setShowTimePicker(true); 
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Combina la fecha seleccionada con la hora seleccionada
      const newDateTime = new Date(gameDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setGameDate(newDateTime);
    }
  };

  const handleScheduleGame = async () => {
    if (!homeTeamId || !awayTeamId) {
      Alert.alert('Error', 'Please select both a home and an away team.');
      return;
    }
    if (homeTeamId === awayTeamId) {
      Alert.alert('Error', 'Home and away teams cannot be the same.');
      return;
    }
    // --- AÑADIDO: Validación de ubicación (opcional pero recomendado) ---
    if (!location) {
      Alert.alert('Error', 'Please enter a location for the game.');
      return;
    }
    // --- FIN AÑADIDO ---

    setIsSubmitting(true);
    setError(null);

    const homeTeam = teams.find(t => t.id === homeTeamId);
    const awayTeam = teams.find(t => t.id === awayTeamId);

    try {
      await firestore().collection('competition_games').add({
        competitionId,
        homeTeamId,
        homeTeamName: homeTeam?.name || 'Unknown',
        awayTeamId,
        awayTeamName: awayTeam?.name || 'Unknown',
        gameDate: firestore.Timestamp.fromDate(gameDate),
        
        // --- AÑADIDO: Guardando el campo de ubicación ---
        location: location,
        // --- FIN AÑADIDO ---

        status: 'scheduled',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Game scheduled successfully!');
      navigation.goBack();

    } catch (e) {
      console.error("Error scheduling game: ", e);
      setError('Could not schedule the game. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (loadingTeams) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Schedule New Game</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Text style={styles.label}>Home Team</Text>
        <Picker
          selectedValue={homeTeamId}
          onValueChange={(itemValue) => setHomeTeamId(itemValue)}
          style={styles.picker}
          enabled={!isSubmitting}
        >
          <Picker.Item label="Select Home Team..." value={null} />
          {teams.map(team => (
            <Picker.Item key={team.id} label={team.name} value={team.id} />
          ))}
        </Picker>

        <Text style={styles.label}>Away Team</Text>
        <Picker
          selectedValue={awayTeamId}
          onValueChange={(itemValue) => setAwayTeamId(itemValue)}
          style={styles.picker}
          enabled={!isSubmitting}
        >
          <Picker.Item label="Select Away Team..." value={null} />
          {teams.map(team => (
            <Picker.Item key={team.id} label={team.name} value={team.id} />
          ))}
        </Picker>

        <Text style={styles.label}>Date and Time</Text>
        <Button title="Select Date & Time" onPress={() => setShowDatePicker(true)} disabled={isSubmitting} />
        <Text style={styles.dateText}>Selected: {gameDate.toLocaleString()}</Text>

        {showDatePicker && (
          <DateTimePicker
            testID="datePicker"
            value={gameDate}
            mode="date"
            is24Hour={true}
            display="default"
            onChange={onDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={gameDate}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        {/* --- AÑADIDO: Campo de texto para la ubicación --- */}
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Central Park - Field 1"
          value={location}
          onChangeText={setLocation}
          editable={!isSubmitting}
        />
        {/* --- FIN AÑADIDO --- */}

        {isSubmitting ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Schedule Game" onPress={handleScheduleGame} disabled={isSubmitting} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, color: '#4b5563', marginBottom: 5, marginTop: 15 },
  picker: { backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, color: '#000000' },
  dateText: { textAlign: 'center', marginVertical: 10, fontSize: 16 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
  // --- AÑADIDO: Estilo para el nuevo input ---
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
});

export default CreateCompetitionGameScreen;