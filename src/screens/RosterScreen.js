import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

const RosterScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [newPlayerName, setNewPlayerName] = useState('');
  const [roster, setRoster] = useState([]);

  useEffect(() => {
    if (!teamId) return;

    const subscriber = firestore()
      .collection('teams')
      .doc(teamId)
      .collection('roster')
      .onSnapshot(querySnapshot => {
        const players = [];
        querySnapshot.forEach(documentSnapshot => {
          players.push({
            ...documentSnapshot.data(),
            id: documentSnapshot.id,
          });
        });
        setRoster(players);
      });

    return () => subscriber();
  }, [teamId]);

  const handleAddPlayer = async () => {
    if (newPlayerName.trim() === '' || !teamId) {
      Alert.alert('Error', 'Player name cannot be empty.');
      return;
    }

    try {
      await firestore()
        .collection('teams')
        .doc(teamId)
        .collection('roster')
        .add({
          playerName: newPlayerName,
          status: "unclaimed", // Estado inicial
          userId: null,
          inviteCode: null,
          ab: 0, hits: 0, walks: 0, k: 0, doubles: 0, triples: 0, homeruns: 0,
        });
      
      setNewPlayerName('');
      
    } catch (error) {
      console.error("Error adding player: ", error);
      Alert.alert('Error', 'Could not add player.');
    }
  };

  // --- NUEVA FUNCIÓN PARA INVITAR ---
  const handleInvitePlayer = async (playerId, playerName) => {
    const inviteCode = `${playerName.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
    
    try {
      await firestore()
        .collection('teams')
        .doc(teamId)
        .collection('roster')
        .doc(playerId)
        .update({
          status: 'invited',
          inviteCode: inviteCode,
        });

      Alert.alert(
        'Invite Code Generated',
        `Share this code with ${playerName}:\n\n${inviteCode}`,
        [{ text: 'Copy & Close' }] // Podríamos añadir lógica para copiar al portapapeles
      );
    } catch (error) {
      console.error("Error generating invite code: ", error);
      Alert.alert('Error', 'Could not generate invite code.');
    }
  };

  // --- NUEVA FUNCIÓN PARA ELIMINAR ---
  const handleDeletePlayer = (playerId, playerName) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to remove ${playerName} from the roster? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestore()
                .collection('teams')
                .doc(teamId)
                .collection('roster')
                .doc(playerId)
                .delete();
              Alert.alert('Success', `${playerName} has been removed.`);
            } catch (error) {
              console.error("Error removing player: ", error);
              Alert.alert('Error', 'Could not remove player.');
            }
          },
        },
      ]
    );
  };

  // --- FILA DEL JUGADOR ACTUALIZADA ---
  const renderPlayerItem = ({ item }) => {
    const getStatusStyle = (status) => {
        if (status === 'claimed') return styles.statusClaimed;
        if (status === 'invited') return styles.statusInvited;
        return styles.statusUnclaimed;
    };

    return (
        <View style={styles.playerRow}>
            <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.playerName}</Text>
                <Text style={[styles.statusText, getStatusStyle(item.status)]}>
                    {item.status || 'unclaimed'}
                </Text>
            </View>
            <View style={styles.playerActions}>
                {item.status !== 'claimed' && (
                    <TouchableOpacity 
                        style={styles.inviteButton} 
                        onPress={() => handleInvitePlayer(item.id, item.playerName)}
                    >
                        <Text style={styles.buttonText}>
                            {item.status === 'invited' ? 'Resend' : 'Invite'}
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePlayer(item.id, item.playerName)}
                >
                    <Text style={styles.buttonText}>X</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.addPlayerCard}>
        <Text style={styles.subHeader}>Add New Player</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter player's name"
          value={newPlayerName}
          onChangeText={setNewPlayerName}
        />
        <Button title="Add Player to Roster" onPress={handleAddPlayer} />
      </View>

      <FlatList
        data={roster}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.listHeader}>Current Roster</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No players on the roster yet.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
};

// --- ESTILOS ACTUALIZADOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  addPlayerCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 3,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  playerRow: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  statusUnclaimed: { color: '#6b7280' },
  statusInvited: { color: '#f59e0b' },
  statusClaimed: { color: '#10b981' },
  playerActions: {
    flexDirection: 'row',
  },
  inviteButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 20,
  }
});
  
export default RosterScreen;