// src/screens/EditGameScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker'; // Ensure this import is correct

const EditGameScreen = ({ route, navigation }) => {
  const { gameId, competitionId } = route.params || {};

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGameDateTime, setNewGameDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load game data
  useEffect(() => {
    if (!gameId) { setError('Game ID not provided.'); setLoading(false); return; }
    setLoading(true);
    const subscriber = firestore().collection('competition_games').doc(gameId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data();
            setGameData({ id: doc.id, ...data });
            if (data.gameDate) { setNewGameDateTime(data.gameDate.toDate()); }
            setError(null);
          } else { setError('Game not found.'); setGameData(null); }
          setLoading(false);
        },
        err => { console.error("Error fetching game data:", err); setError('Could not load details.'); setGameData(null); setLoading(false); }
      );
    return () => subscriber();
  }, [gameId]);

  // Date picker handler
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // On Android, picker closes automatically
    if (selectedDate) { // Check if a date was actually selected
        const currentDate = selectedDate;
        const updatedDateTime = new Date(currentDate);
        updatedDateTime.setHours(newGameDateTime.getHours());
        updatedDateTime.setMinutes(newGameDateTime.getMinutes());
        setNewGameDateTime(updatedDateTime);
    }
     console.log("Date Changed:", selectedDate); // Add log
  };

  // Time picker handler
  const onChangeTime = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
     if (selectedTime) { // Check if a time was selected
        const currentTime = selectedTime;
        const updatedDateTime = new Date(newGameDateTime);
        updatedDateTime.setHours(currentTime.getHours());
        updatedDateTime.setMinutes(currentTime.getMinutes());
        setNewGameDateTime(updatedDateTime);
    }
    console.log("Time Changed:", selectedTime); // Add log
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    if (!gameData) return;
    if (newGameDateTime < new Date()) { Alert.alert('Invalid Date', 'Date/Time must be in the future.'); return; }
    setIsSaving(true); setError(null);
    try {
      await firestore().collection('competition_games').doc(gameId).update({
          gameDate: firestore.Timestamp.fromDate(newGameDateTime),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
      Alert.alert('Success', 'Game schedule updated.'); navigation.goBack();
    } catch (updateError) { console.error("Error updating game:", updateError); setError('Could not save changes.'); setIsSaving(false); }
  };

  // Render logic
  if (loading) { return <View style={styles.center}><ActivityIndicator size="large" /></View>; }
  if (error && !gameData) { return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>; }
  if (!gameData) { return <View style={styles.center}><Text>Game data not available.</Text></View>; }

  const formattedDate = newGameDateTime.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = newGameDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit Game Schedule</Text>
        {/* --- CHANGED TO "vs" --- */}
        <Text style={styles.gameInfo}>{gameData.homeTeamName} vs {gameData.awayTeamName}</Text>

        {/* Date Selector */}
        <Text style={styles.label}>New Date:</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => { console.log('Date button pressed'); setShowDatePicker(true); }}>
            <Text style={styles.dateButtonText}>{formattedDate}</Text>
        </TouchableOpacity>
        {showDatePicker && (
            <DateTimePicker
                testID="datePicker"
                value={newGameDateTime}
                mode="date"
                display="default" // Or "spinner", "calendar"
                onChange={onChangeDate}
                minimumDate={new Date()} // Ensure minimum date is set
            />
        )}

        {/* Time Selector */}
        <Text style={styles.label}>New Time:</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => { console.log('Time button pressed'); setShowTimePicker(true); }}>
            <Text style={styles.dateButtonText}>{formattedTime}</Text>
        </TouchableOpacity>
        {showTimePicker && (
            <DateTimePicker
                testID="timePicker"
                value={newGameDateTime}
                mode="time"
                display="default" // Or "spinner", "clock"
                onChange={onChangeTime}
            />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Action Buttons */}
        <View style={styles.saveButtonContainer}>
            <Button title={isSaving ? "Saving..." : "Save Changes"} onPress={handleSaveChanges} disabled={isSaving} />
        </View>
        <View style={styles.cancelButtonContainer}>
            <Button title="Cancel" onPress={() => navigation.goBack()} color="#6b7280" disabled={isSaving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 25 },
  gameInfo: { fontSize: 18, fontWeight: '500', color: '#374151', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 16, color: '#4b5563', marginBottom: 5, marginTop: 15 },
  dateButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'flex-start' },
  dateButtonText: { fontSize: 16, color: '#1f2937' },
  saveButtonContainer: { marginTop: 30 },
  cancelButtonContainer: { marginTop: 15 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10, marginTop: 10 },
});

export default EditGameScreen;