import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  SafeAreaView, // <-- Asegúrate que SafeAreaView esté importado
} from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context'; // <-- O usa esta
import firestore from '@react-native-firebase/firestore';

const SelectLineupScreen = ({ route, navigation }) => {
  // --- MODIFICADO: Leer todos los parámetros ---
  const {
    teamId,
    opponentName,
    location, // Puede ser undefined si no se pasó
    locationStatus,
    isLeagueGame, // Nuevo
    leagueGameId, // Nuevo
    competitionId // Nuevo
  } = route.params;
  // --- FIN MODIFICACIÓN ---

  const [availablePlayers, setAvailablePlayers] = React.useState([]);
  const [lineup, setLineup] = React.useState([]);

  React.useEffect(() => {
    // Cargar roster (sin cambios)
    const subscriber = firestore()
      .collection('teams')
      .doc(teamId)
      .collection('roster')
      .onSnapshot(querySnapshot => {
        const players = [];
        querySnapshot.forEach(doc => {
          players.push({ id: doc.id, ...doc.data() });
        });
        setAvailablePlayers(players);
      });
    return () => subscriber();
  }, [teamId]);

  const handleSelectPlayer = (player) => {
    // Lógica de selección (sin cambios)
    const isInLineup = lineup.some(p => p.id === player.id);
    if (isInLineup) {
      setLineup(lineup.filter(p => p.id !== player.id));
    } else {
      if (lineup.length < 9) {
        setLineup([...lineup, player]);
      } else {
        Alert.alert('Lineup Full', 'You can only select 9 players.');
      }
    }
  };

  // --- MODIFICADO: Pasar todos los parámetros ---
  const handleStartGame = () => {
    navigation.navigate('InProgressGame', {
      teamId: teamId,
      opponentName: opponentName,
      locationStatus: locationStatus,
      lineup: lineup, // El lineup seleccionado
      fullRoster: availablePlayers, // El roster completo para sustituciones
      isLeagueGame: isLeagueGame || false, // Pasar el indicador (default false)
      leagueGameId: leagueGameId || null, // Pasar ID de juego de liga (default null)
      competitionId: competitionId || null // Pasar ID de competencia (default null)
      // location: location // Pasar ubicación si existe
    });
  };
  // --- FIN MODIFICACIÓN ---

  return (
    <SafeAreaView style={styles.container}>
      {/* Columna Jugadores Disponibles (sin cambios) */}
      <View style={styles.column}>
        <Text style={styles.header}>Available Players</Text>
        <FlatList
          data={availablePlayers}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const isSelected = lineup.some(p => p.id === item.id);
            return (
              <TouchableOpacity
                style={[styles.playerItem, isSelected && styles.playerItemSelected]}
                onPress={() => handleSelectPlayer(item)}
              >
                <Text style={isSelected ? styles.playerItemTextSelected : styles.playerItemText}>
                  {item.playerName || item.name}
                </Text>
              </TouchableOpacity>
            )
          }}
        />
      </View>

      {/* Columna Orden al Bate (sin cambios) */}
      <View style={styles.column}>
        <Text style={styles.header}>Batting Order ({lineup.length}/9)</Text>
        <FlatList
          data={lineup}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <View style={styles.lineupItem}>
              <Text style={styles.lineupOrder}>{index + 1}.</Text>
              <Text style={styles.lineupName}>{item.playerName || item.name}</Text>
            </View>
          )}
        />
      </View>

      {/* Botón Start Game (sin cambios) */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, lineup.length !== 9 && styles.buttonDisabled]}
          onPress={handleStartGame}
          disabled={lineup.length !== 9}
        >
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Estilos (sin cambios)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f7fa',
  },
  column: {
    flex: 1,
    padding: 10,
    paddingBottom: 80, // Espacio para que el botón no tape la lista
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  playerItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  playerItemSelected: {
    backgroundColor: '#9ca3af',
    borderColor: '#6b7280',
  },
  playerItemText: {
    fontSize: 16,
  },
  playerItemTextSelected: {
    fontSize: 16,
    color: 'white',
    textDecorationLine: 'line-through',
  },
  lineupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 6,
  },
  lineupOrder: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginRight: 10,
  },
  lineupName: {
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#f5f7fa',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#3b82f6', // Color azul cuando está activo
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af', // Color gris cuando está deshabilitado
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SelectLineupScreen;