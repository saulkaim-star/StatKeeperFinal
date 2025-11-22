import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Platform, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateEventScreen = ({ route, navigation }) => {
  const { teamId } = route.params;

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dateTime;
    setShowDatePicker(Platform.OS === 'ios');
    setDateTime(currentDate);
  };

  const onChangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || dateTime;
    setShowTimePicker(Platform.OS === 'ios');
    setDateTime(currentTime);
  };

  const handleSaveEvent = async () => {
    if (!title || !location) {
        Alert.alert('Error', 'Please complete the title and location.');
        return;
    }
    if (dateTime < new Date()) {
        Alert.alert('Error', 'The event date and time must be in the future.');
        return;
    }

    setIsLoading(true);

    try {
        await firestore()
            .collection('teams').doc(teamId).collection('events') // <-- RUTA CORREGIDA
            .add({
                title,
                location,
                dateTime: firestore.Timestamp.fromDate(dateTime),
                attendees: {},
                createdAt: firestore.FieldValue.serverTimestamp(),
            });

        Alert.alert('Success', 'The event has been saved.');
        navigation.goBack();
    } catch (error) {
        console.error("Error saving event: ", error);
        Alert.alert('Error', 'Could not save the event.');
    } finally {
        setIsLoading(false);
    }
  };

  const formattedDate = dateTime.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedTime = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.header}>Create New Event</Text>

        <Text style={styles.label}>Event Title / Opponent</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Practice or vs. Tigres"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Central Park Field #2"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formattedDate}</Text>
        </TouchableOpacity>
        {showDatePicker && (
            <DateTimePicker value={dateTime} mode="date" display="default" onChange={onChangeDate} />
        )}

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateButtonText}>{formattedTime}</Text>
        </TouchableOpacity>
        {showTimePicker && (
            <DateTimePicker value={dateTime} mode="time" display="default" onChange={onChangeTime} />
        )}

        <View style={styles.saveButtonContainer}>
            <Button
                title={isLoading ? "Saving..." : "Save Event"}
                onPress={handleSaveEvent}
                disabled={isLoading}
            />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    form: { padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
    label: { fontSize: 16, color: '#4b5563', marginBottom: 5, marginTop: 10 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 10, fontSize: 16, },
    dateButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 10, alignItems: 'flex-start' },
    dateButtonText: { fontSize: 16, color: '#1f2937' },
    saveButtonContainer: { marginTop: 20, },
});

export default CreateEventScreen;