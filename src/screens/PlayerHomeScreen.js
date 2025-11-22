import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, SafeAreaView, TouchableOpacity, ScrollView, Image, Linking, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// --- Pequeños componentes para el Dashboard (Sin cambios) ---
const NextGame = ({ game, navigation }) => {
    if (!game) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Next Game</Text>
                <Text style={styles.noDataText}>No upcoming games scheduled.</Text>
            </View>
        );
    }
    const eventDate = game.gameDate?.toDate();
    const formattedDate = eventDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const formattedTime = eventDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Next Game</Text>
            <Text style={styles.eventTitle}>vs {game.opponentName} <Text style={styles.locationText}>{game.isHome ? '(Home)' : '(Away)'}</Text></Text>
            <Text style={styles.eventDetails}>{formattedDate} at {formattedTime}</Text>
            {game.location && (
                <Text style={styles.eventDetails}>📍 {game.location}</Text>
            )}
        </View>
    );
};

const RecentAnnouncements = ({ announcements, navigation }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Announcements</Text>
            {announcements.length > 0 ? (
                announcements.map(item => (
                    <Text key={item.id} style={styles.announcementText}>• {item.text}</Text>
                ))
            ) : (
                <Text style={styles.noDataText}>No recent announcements.</Text>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('Hub', { screen: 'Announcements' })}>
                <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
        </View>
    );
};

const LatestPoll = ({ poll, teamId, navigation }) => {
    if (!poll) {
        return null;
    }
    return (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PollDetails', { pollId: poll.id, teamId })}>
            <Text style={styles.cardTitle}>Active Poll</Text>
            <Text style={styles.pollQuestion}>{poll.question}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Hub', { screen: 'Polls' })}>
                 <Text style={styles.viewAllText}>View All Polls →</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};
// --- Fin de Componentes Pequeños ---


// --- Componente Principal ---
const PlayerHomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [playerStats, setPlayerStats] = useState(null); // <--- Los stats empiezan en null
  const [teamId, setTeamId] = useState(null); 
  const [competitionId, setCompetitionId] = useState(null);
  const [nextGame, setNextGame] = useState(null); 
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [latestPoll, setLatestPoll] = useState(null);
  const [playerName, setPlayerName] = useState('Player');
  const [playerNumber, setPlayerNumber] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [playerRosterId, setPlayerRosterId] = useState(null); 

  const handleLogout = () => { auth().signOut(); };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => ( <Button onPress={handleLogout} title="Log Out" color="#ef4444" /> ),
    });
  }, [navigation]);

  // --- LÓGICA DE LISTENERS ---
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
        setError("Authentication error.");
        setLoading(false);
        return;
    }

    const userSubscriber = firestore().collection('users').doc(currentUser.uid)
      .onSnapshot(userDoc => {
        if (!userDoc.exists) {
            setError("User profile does not exist.");
            setLoading(false);
            return;
        }
        
        const userData = userDoc.data();
        const currentTeamId = userData.teams?.[0] || userData.teamId;
        
        if (!currentTeamId) {
            setError("User is not associated with any team.");
            setLoading(false);
            return;
        }
        
        setTeamId(currentTeamId);

      }, err => {
        console.error("Error fetching user profile:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => userSubscriber();
  }, []);


  useEffect(() => {
    if (!teamId) return; 

    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const rosterSubscriber = firestore().collection('teams').doc(teamId).collection('roster')
      .where('userId', '==', currentUser.uid).limit(1)
      .onSnapshot(rosterSnap => {
        if (!rosterSnap.empty) {
            const rosterDoc = rosterSnap.docs[0];
            const rosterData = rosterDoc.data();
            
            setPlayerRosterId(rosterDoc.id); 
            setPlayerName(rosterData.playerName || rosterData.name || 'Player');
            setPlayerNumber(rosterData.playerNumber || null);
            setPlayerPosition(rosterData.playerPosition || null);
            setPhotoURL(rosterData.photoURL || null);
            
            // --- ¡¡¡CORRECCIÓN APLICADA!!! ---
            // El bloque que calculaba stats desde el roster (poniéndolos a 0)
            // ha sido eliminado de aquí.
            // --- FIN DE LA CORRECCIÓN ---
            
            setLoading(false); 
            
        } else {
            console.warn("User is in team but has no roster doc.");
            setLoading(false);
        }
      }, err => console.error("Error fetching roster:", err));

    const announcementSubscriber = firestore().collection('teams').doc(teamId).collection('announcements')
      .orderBy('createdAt', 'desc').limit(2)
      .onSnapshot(snap => {
        if (!snap.empty) setRecentAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()})));
      }, err => console.error("Error fetching announcements:", err));

    const pollSubscriber = firestore().collection('teams').doc(teamId).collection('polls')
      .orderBy('createdAt', 'desc').limit(1)
      .onSnapshot(snap => {
        if (!snap.empty) setLatestPoll({ id: snap.docs[0].id, ...snap.docs[0].data() });
        else setLatestPoll(null);
      }, err => console.error("Error fetching polls:", err));

    const compTeamSubscriber = firestore().collection('competition_teams')
      .where('teamId', '==', teamId).limit(1)
      .onSnapshot(snap => {
        if (!snap.empty) {
            const compId = snap.docs[0].data().competitionId;
            setCompetitionId(compId); 
        } else {
            setCompetitionId(null); 
        }
      }, err => console.error("Error fetching competition link:", err));

    return () => {
      rosterSubscriber();
      announcementSubscriber();
      pollSubscriber();
      compTeamSubscriber();
    };
  }, [teamId]);


  useEffect(() => {
    if (!competitionId || !teamId || !playerRosterId) {
        setNextGame(null);
        // Si no hay competición, inicializamos los stats a 0
        setPlayerStats({ avg: '.000', hits: 0, ab: 0, homeruns: 0, walks: 0, k: 0 });
        return;
    }
    
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    
    const now = firestore.Timestamp.now();
    let nextHomeListener = () => {};
    let nextAwayListener = () => {};
    let nextHomeGame = null;
    let nextAwayGame = null;

    const findEarliestGame = () => {
        if (nextHomeGame && nextAwayGame) { setNextGame(nextHomeGame.gameDate.toDate() < nextAwayGame.gameDate.toDate() ? nextHomeGame : nextAwayGame); } 
        else { setNextGame(nextHomeGame || nextAwayGame); }
    };
    
    const homeQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('homeTeamId', '==', teamId).where('status', '==', 'scheduled').where('gameDate', '>=', now).orderBy('gameDate', 'asc').limit(1);
    const awayQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('awayTeamId', '==', teamId).where('status', '==', 'scheduled').where('gameDate', '>=', now).orderBy('gameDate', 'asc').limit(1);

    nextHomeListener = homeQuery.onSnapshot(snapshot => {
        if (!snapshot.empty) { const game = snapshot.docs[0].data(); nextHomeGame = { ...game, id: snapshot.docs[0].id, opponentName: game.awayTeamName, isHome: true }; } 
        else { nextHomeGame = null; }
        findEarliestGame();
    }, error => console.error("Error fetching next home game:", error));
    
    nextAwayListener = awayQuery.onSnapshot(snapshot => {
        if (!snapshot.empty) { const game = snapshot.docs[0].data(); nextAwayGame = { ...game, id: snapshot.docs[0].id, opponentName: game.homeTeamName, isHome: false }; } 
        else { nextAwayGame = null; }
        findEarliestGame();
    }, error => console.error("Error fetching next away game:", error));

    // Esta es la lógica que calcula los stats desde los juegos
    const calculateLeagueStats = (games) => {
        const stats = { ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0, k: 0 };
        
        games.forEach(game => {
            const isHome = game.homeTeamId === teamId;
            const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;
            if (boxScore && Array.isArray(boxScore)) {
                let playerStat = boxScore.find(p => p.id === playerRosterId);
                if (!playerStat) {
                    playerStat = boxScore.find(p => p.playerName === playerName || p.name === playerName);
                }

                if (playerStat) {
                    stats.ab += (playerStat.game_ab || 0);
                    stats.hits += (playerStat.game_hits || 0);
                    stats.doubles += (playerStat.game_doubles || 0);
                    stats.triples += (playerStat.game_triples || 0);
                    stats.homeruns += (playerStat.game_homeruns || 0);
                    stats.walks += (playerStat.game_walks || 0);
                    stats.k += (playerStat.game_k || 0);
                }
            }
        });
        const avg = stats.ab > 0 ? (stats.hits / stats.ab).toFixed(3).replace(/^0/, '') : '.000';
        setPlayerStats({ ...stats, avg });
    };

    const homeGamesQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('homeTeamId', '==', teamId).where('status', '==', 'completed');
    const awayGamesQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('awayTeamId', '==', teamId).where('status', '==', 'completed');

    let homeStatsListener = () => {};
    let awayStatsListener = () => {};
    let homeGamesData = [];
    let awayGamesData = [];

    homeStatsListener = homeGamesQuery.onSnapshot(snap => {
        homeGamesData = snap.docs.map(doc => doc.data());
        calculateLeagueStats([...homeGamesData, ...awayGamesData]);
    }, err => console.error("Error fetching home league stats:", err));

    awayStatsListener = awayGamesQuery.onSnapshot(snap => {
        awayGamesData = snap.docs.map(doc => doc.data());
        calculateLeagueStats([...homeGamesData, ...awayGamesData]);
    }, err => console.error("Error fetching away league stats:", err));


    return () => {
        nextHomeListener();
        nextAwayListener();
        homeStatsListener();
        awayStatsListener();
    };
  }, [competitionId, teamId, playerRosterId, playerName]); 
  
  // --- FIN DE LA LÓGICA DE LISTENERS ---
  
  // --- Función para el Botón Web (Sin cambios) ---
  const handleOpenWebDashboard = async () => {
    if (!competitionId) {
        Alert.alert("Error", "Cannot open web dashboard. You are not in a competition.");
        return;
    }
    const vercelURL = 'https://statkeeper-liga-webbaseball.vercel.app';
    const webDashboardUrl = `${vercelURL}/liga/${competitionId}`;

    try {
        const supported = await Linking.canOpenURL(webDashboardUrl);
        if (supported) {
            await Linking.openURL(webDashboardUrl);
        } else {
            Alert.alert("Error", `Don't know how to open this URL: ${webDashboardUrl}`);
        }
    } catch (err) {
        console.error("Failed to open web URL:", err);
        Alert.alert("Error", "Failed to open the link.");
    }
  };


  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text style={{color: 'red'}}>{error}</Text></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView style={{flex: 1}}>
            
            {/* --- Cabecera del Perfil --- */}
            <View style={styles.profileHeader}>
                {photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.photo} />
                ) : (
                    <View style={styles.photoPlaceholder}>
                        <Text style={styles.photoPlaceholderText}>👤</Text>
                    </View>
                )}
                <View style={styles.profileInfo}>
                    <Text style={styles.playerName}>{playerName}</Text>
                    {(playerNumber || playerPosition) && (
                        <Text style={styles.teamInfo}>
                            {playerNumber ? `#${playerNumber}` : ''}
                            {playerNumber && playerPosition ? '  •  ' : ''}
                            {playerPosition || ''}
                        </Text>
                    )}
                </View>
                <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditPlayerProfile')}>
                    <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
            </View>
            

            {/* --- Estadísticas --- */}
            {playerStats ? (
            <>
                <Text style={styles.sectionTitle}>Season Stats</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.avg}</Text><Text style={styles.statLabel}>AVG</Text></View>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.hits}</Text><Text style={styles.statLabel}>H</Text></View>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.ab}</Text><Text style={styles.statLabel}>AB</Text></View>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.homeruns}</Text><Text style={styles.statLabel}>HR</Text></View>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.walks}</Text><Text style={styles.statLabel}>BB</Text></View>
                    <View style={styles.statBox}><Text style={styles.statValue}>{playerStats.k}</Text><Text style={styles.statLabel}>K</Text></View>
                </View>
            </>
            ) : (
             <View style={styles.center}><ActivityIndicator size="small" color="#3b82f6" /></View>
            )}

            {/* --- Tarjetas de Dashboard --- */}
            <NextGame game={nextGame} navigation={navigation} />
            <RecentAnnouncements announcements={recentAnnouncements} navigation={navigation} />
            <LatestPoll poll={latestPoll} teamId={teamId} navigation={navigation} />

            <View style={{ height: 10 }} />
        </ScrollView>
        
    </SafeAreaView>
  );
};

// --- Estilos (Sin cambios) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e5e7eb',
    },
    photoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e5e7eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPlaceholderText: {
        fontSize: 40,
        color: '#9ca3af',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    playerName: { 
        fontSize: 24,
        fontWeight: 'bold', 
        color: '#1f2937', 
    },
    teamInfo: { 
        fontSize: 16, 
        color: '#6b7280', 
        marginTop: 4,
    },
    editButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    editButtonText: {
        fontSize: 20,
    },
    sectionTitle: {
        fontSize: 16, 
        color: '#6b7280', 
        textAlign: 'center', 
        marginBottom: 15,
        marginTop: 10,
        fontWeight: '600',
    },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingHorizontal: 10 },
    statBox: { backgroundColor: 'white', borderRadius: 12, padding: 15, width: '30%', marginBottom: 15, alignItems: 'center', elevation: 2 },
    statValue: { fontSize: 24, fontWeight: 'bold', color: '#3b82f6' },
    statLabel: { fontSize: 14, color: '#6b7280', marginTop: 2 },
    card: { backgroundColor: 'white', borderRadius: 12, padding: 15, marginHorizontal: 15, marginBottom: 15, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#6b7280', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 5 },
    noDataText: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: 10 },
    eventTitle: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
    eventDetails: { fontSize: 14, color: '#4b5563', marginTop: 2 },
    announcementText: { fontSize: 14, color: '#374151', marginBottom: 5 },
    pollQuestion: { fontSize: 16, fontWeight: '500', color: '#111827' },
    viewAllText: { fontSize: 14, color: '#3b82f6', fontWeight: 'bold', textAlign: 'right', marginTop: 10 },
    locationText: { fontSize: 14, fontWeight: 'normal', color: 'gray' }, 

    webButton: {
        backgroundColor: '#10B981', 
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    webButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },

    infoCard: { 
        backgroundColor: 'white', 
        paddingVertical: 15, 
        paddingHorizontal: 20, 
        borderTopWidth: 1, 
        borderTopColor: '#e5e7eb',
        paddingBottom: 25 
    },
});

export default PlayerHomeScreen;