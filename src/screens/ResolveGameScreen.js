// src/screens/ResolveGameScreen.js
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

const ResolveGameScreen = ({ route, navigation }) => {
  const { gameId, competitionId } = route.params || {}; // Recibir parámetros

  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [finalHomeScore, setFinalHomeScore] = useState('');
  const [finalAwayScore, setFinalAwayScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Efecto para cargar los datos del juego
  useEffect(() => {
    if (!gameId) {
      setError('Game ID not provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    const subscriber = firestore()
      .collection('competition_games')
      .doc(gameId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            const data = doc.data();
            setGameData({ id: doc.id, ...data });
            // Pre-rellenar scores si ya existen (útil si solo se edita el estado)
            setFinalHomeScore(data.homeScore?.toString() ?? '');
            setFinalAwayScore(data.awayScore?.toString() ?? '');
            setError(null);
          } else {
            setError('Game not found.');
            setGameData(null);
          }
          setLoading(false);
        },
        err => {
          console.error("Error fetching game data:", err);
          setError('Could not load game details.');
          setGameData(null);
          setLoading(false);
        }
      );
    // Cleanup listener
    return () => subscriber();
  }, [gameId]);

  // Lógica para confirmar el resultado (PENDIENTE)
  const handleConfirmResult = async () => {
    const homeScoreNum = parseInt(finalHomeScore, 10);
    const awayScoreNum = parseInt(finalAwayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      Alert.alert('Invalid Score', 'Please enter valid, non-negative numbers for both scores.');
      return;
    }
    if (!gameData) return;

    setIsSaving(true);
    setError(null); // Limpiar errores previos

    try {
      // AQUÍ VA LA LÓGICA DE ACTUALIZACIÓN EN FIRESTORE
      await firestore().collection('competition_games').doc(gameId).update({
          homeScore: homeScoreNum,
          awayScore: awayScoreNum,
          status: 'completed',
          homeManagerValidated: true, // Marcar como validado por ambos
          awayManagerValidated: true,
          resolvedByOrganizer: true, // Campo opcional para registro
          lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

      console.log("Game result updated successfully by organizer.");
      Alert.alert('Success', 'Game result has been manually confirmed.');
      navigation.goBack(); // Volver al dashboard

    } catch (updateError) {
      console.error("Error updating game result:", updateError);
      setError('Could not update the game result. Please try again.');
      setIsSaving(false); // Detener estado de guardado en error
    }
    // No necesitamos setIsSaving(false) en éxito porque navegamos atrás
  };

  // Renderizado
  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (error && !gameData) { // Mostrar error solo si no hay datos del juego
    return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  }
  if (!gameData) {
    return <View style={styles.center}><Text>Game data not available.</Text></View>;
  }

  // Determinar si fue una disputa para mostrar scores reportados
  const isDispute = gameData.status === 'pending_validation' && gameData.homeManagerValidated && gameData.awayManagerValidated;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Resolve Game Result</Text>
        <Text style={styles.gameTitle}>{gameData.awayTeamName} @ {gameData.homeTeamName}</Text>
        <Text style={styles.gameDate}>
          {gameData.gameDate?.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>

        {isDispute && (
          <View style={styles.reportedScores}>
            <Text style={styles.reportedTitle}>Reported Scores (Dispute):</Text>
            {/* Es importante notar que homeScore/awayScore podrían tener el último valor guardado, no necesariamente el de cada manager */}
            <Text style={styles.reportedDetail}>- Home Manager reported score might differ.</Text>
            <Text style={styles.reportedDetail}>- Away Manager reported score might differ.</Text>
            <Text style={styles.reportedDetail}>(Showing last saved: H:{gameData.homeScore ?? '?'} A:{gameData.awayScore ?? '?'})</Text>
             {/* Idealmente, necesitaríamos campos separados como homeReportedScore y awayReportedScore */}
          </View>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* --- CAMBIO --- */}
        <Text style={styles.label}>{gameData.homeTeamName || 'Home'} Score:</Text>
        {/* --- FIN CAMBIO --- */}
        <TextInput
          style={styles.input}
          value={finalHomeScore}
          onChangeText={setFinalHomeScore}
          keyboardType="number-pad"
          placeholder={`Enter ${gameData.homeTeamName || 'Home'} Score`}
          editable={!isSaving}
        />

        {/* --- CAMBIO --- */}
        <Text style={styles.label}>{gameData.awayTeamName || 'Away'} Score:</Text>
        {/* --- FIN CAMBIO --- */}
        <TextInput
          style={styles.input}
          value={finalAwayScore}
          onChangeText={setFinalAwayScore}
          keyboardType="number-pad"
          placeholder={`Enter ${gameData.awayTeamName || 'Away'} Score`}
          editable={!isSaving}
        />

        <Button
          title={isSaving ? "Confirming..." : "Confirm Final Result"}
          onPress={handleConfirmResult}
          disabled={isSaving}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 20 },
  gameTitle: { fontSize: 18, fontWeight: '500', color: '#374151', textAlign: 'center', marginBottom: 5 },
  gameDate: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  reportedScores: {
      backgroundColor: '#fffbeb', // Amarillo muy claro
      borderColor: '#fcd34d', // Amarillo
      borderWidth: 1,
      borderRadius: 8,
      padding: 15,
      marginBottom: 20,
  },
  reportedTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#b45309', // Naranja oscuro
      marginBottom: 5,
  },
   reportedDetail: {
      fontSize: 14,
      color: '#b45309',
      fontStyle: 'italic',
      marginTop: 2,
  },
  label: { fontSize: 16, color: '#4b5563', marginBottom: 5, marginTop: 10 },
  input: {
    backgroundColor: 'white', borderWidth: 1, borderColor: '#d1d5db',
    borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10,
    fontSize: 18, marginBottom: 15
  },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default ResolveGameScreen;