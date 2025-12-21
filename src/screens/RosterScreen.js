import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PlayerCard from '../components/PlayerCard';

const RosterScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [newPlayerName, setNewPlayerName] = useState('');
  const [roster, setRoster] = useState([]);
  const [games, setGames] = useState([]); // Store team games

  // States for Player Card
  const [teamLogo, setTeamLogo] = useState(null);
  const [teamName, setTeamName] = useState(''); // Added teamName
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    // Fetch Team Details (Logo + Name)
    const fetchTeamDetails = async () => {
      try {
        const teamDoc = await firestore().collection('teams').doc(teamId).get();
        if (teamDoc.exists) {
          const data = teamDoc.data();
          if (data.photoURL) setTeamLogo(data.photoURL);
          if (data.teamName) setTeamName(data.teamName);
        }
      } catch (error) {
        console.error("Error fetching team details:", error);
      }
    };
    fetchTeamDetails();

    // Fetch Games for Stats Calculation
    const fetchGames = () => {
      const unsubscribeHome = firestore()
        .collection('competition_games')
        .where('homeTeamId', '==', teamId)
        .where('status', '==', 'completed')
        .onSnapshot(snapshot => {
          const homeGames = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setGames(prev => {
            const others = prev.filter(g => g.homeTeamId !== teamId);
            return [...others, ...homeGames];
          });
        });

      const unsubscribeAway = firestore()
        .collection('competition_games')
        .where('awayTeamId', '==', teamId)
        .where('status', '==', 'completed')
        .onSnapshot(snapshot => {
          const awayGames = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          setGames(prev => {
            const others = prev.filter(g => g.awayTeamId !== teamId);
            return [...others, ...awayGames];
          });
        });

      return () => {
        unsubscribeHome();
        unsubscribeAway();
      };
    };
    const unsubscribeGames = fetchGames();

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

    return () => {
      subscriber();
      unsubscribeGames();
    };
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
          status: "unclaimed",
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

      // Share Logic
      const message = `⚾ Join ${teamName || 'our team'} on StatKeeper!\n\n🔑 Invite Code: ${inviteCode}\n\n📲 Download App: https://statkeeperweb.vercel.app/`;

      try {
        await Share.share({
          message: message,
          title: 'Join Team Invite',
        });
      } catch (e) {
        // Fallback or ignore cancel
      }

    } catch (error) {
      console.error("Error generating invite code: ", error);
      Alert.alert('Error', 'Could not generate invite code.');
    }
  };

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

  // --- ABRIR MODAL CON DATOS CALCULADOS DE LOS JUEGOS ---
  const handleViewCard = (player) => {
    // 1. Inicializar stats en 0
    const stats = { ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0 };

    // 2. Iterar sobre todos los juegos cargados
    games.forEach(game => {
      const isHome = game.homeTeamId === teamId;
      const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;

      if (boxScore && Array.isArray(boxScore)) {
        // Buscar al jugador por ID o Nombre
        const playerStat = boxScore.find(p => p.id === player.id || p.playerName === player.playerName);

        if (playerStat) {
          stats.ab += (playerStat.game_ab || 0);
          stats.hits += (playerStat.game_hits || 0);
          stats.doubles += (playerStat.game_doubles || 0);
          stats.triples += (playerStat.game_triples || 0);
          stats.homeruns += (playerStat.game_homeruns || 0);
          stats.walks += (playerStat.game_walks || 0);
        }
      }
    });

    // 3. OPS Logic & Example Fallback
    let ops, avg, finalHits;

    if (stats.ab === 0) {
      // SHOW EXAMPLE STATS (Requested for Demo/New Players)
      ops = '.900';
      avg = '.500';
      finalHits = 6;
    } else {
      const singles = stats.hits - (stats.doubles + stats.triples + stats.homeruns);
      const totalBases = singles + (2 * stats.doubles) + (3 * stats.triples) + (4 * stats.homeruns);
      const slg = stats.ab > 0 ? totalBases / stats.ab : 0;
      const obp = (stats.ab + stats.walks) > 0 ? (stats.hits + stats.walks) / (stats.ab + stats.walks) : 0;
      ops = (slg + obp).toFixed(3).replace(/^0/, '');
      avg = (stats.hits / stats.ab).toFixed(3).replace(/^0/, '');
      finalHits = stats.hits;
    }

    setSelectedPlayer({
      ...player,
      avg,
      ops,
      hits: finalHits
    });
    setCardVisible(true);
  };

  const renderPlayerItem = ({ item }) => {
    const getStatusStyle = (status) => {
      if (status === 'claimed') return styles.statusClaimed;
      if (status === 'invited') return styles.statusInvited;
      return styles.statusUnclaimed;
    };

    return (
      <View style={styles.playerRow}>
        <TouchableOpacity style={styles.playerInfo} onPress={() => handleViewCard(item)}>
          {/* Hacemos click en el nombre para ver la tarjeta */}
          <Text style={styles.playerName}>{item.playerName} 📷</Text>
          <Text style={[styles.statusText, getStatusStyle(item.status)]}>
            {item.status || 'unclaimed'}
          </Text>
        </TouchableOpacity>
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

      {/* --- MODAL DE PLAYER CARD --- */}
      <Modal
        visible={cardVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCardVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Botón de cerrar Absoluto y con ZIndex alto */}
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setCardVisible(false)}>
            <Text style={styles.closeModalText}>X</Text>
          </TouchableOpacity>

          <View style={styles.modalContent}>
            <PlayerCard
              player={selectedPlayer} // Pasamos el jugador seleccionado con stats calculadas
              teamLogo={teamLogo}
            />
          </View>
        </View>
      </Modal>
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
  },
  // Styles for Modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', // Darker background for premium feel
  },
  modalContent: {
    alignItems: 'center',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 10
  },
  closeModalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
  },
});

export default RosterScreen;