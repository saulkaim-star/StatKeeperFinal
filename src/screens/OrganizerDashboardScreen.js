import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  Linking,

  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { handleDeleteAccount } from '../utils/authUtils';

// --- Funciones Helper (calculateAvg, getLeaders) ... (SIN CAMBIOS) ---
const calculateAvg = (hits, ab) => {
  const avg = ab > 0 ? (hits / ab) : 0;
  return avg.toFixed(3).toString().replace(/^0/, '');
};
const getLeaders = (statKey, players, valueExtractor, isAvg = false, statLabel = statKey) => {
  if (!players || players.length === 0) {
    return { stat: statLabel, name: "N/A", value: isAvg ? ".000" : 0, teamName: "" };
  }
  const sortedPlayers = [...players].sort((a, b) => (valueExtractor(b) || 0) - (valueExtractor(a) || 0));
  const topValue = valueExtractor(sortedPlayers[0]) || 0;
  if (topValue === 0 && !isAvg) {
    return { stat: statLabel, name: "N/A", value: 0, teamName: "" };
  }
  const leaders = sortedPlayers.filter(p => (valueExtractor(p) || 0) === topValue);
  const leaderNames = leaders.map(p => `${p.playerName || 'Unknown'} (${p.teamName || '?'})`).join(", ");
  const displayValue = isAvg ? calculateAvg(leaders[0]?.hits || 0, leaders[0]?.ab || 0) : topValue;
  return { stat: statLabel, name: leaderNames, value: displayValue, teamName: "" };
};

// --- Componentes (StandingItem, GameResultItem, PendingGameItem, LeaderItem) ... (SIN CAMBIOS) ---
const StandingItem = ({ item, index }) => (
  <View style={styles.standingRow}>
    <Text style={[styles.standingCell, styles.rankCell]}>{index + 1}</Text>
    <Text style={[styles.standingCell, styles.teamNameCell]} numberOfLines={1} ellipsizeMode='tail'>{item.name}</Text>
    <Text style={styles.standingCell}>{item.GP}</Text>
    <Text style={styles.standingCell}>{item.W}</Text>
    <Text style={styles.standingCell}>{item.L}</Text>
    <Text style={styles.standingCell}>{item.T}</Text>
  </View>
);
const GameResultItem = ({ item }) => {
  const gameDate = item.gameDate?.toDate();
  const formattedDate = gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const statusStyle = styles[`status_${item.status}`] || styles.status_unknown;
  return (
    <View style={styles.gameResultRow}>
      <Text style={styles.gameResultDate}>{formattedDate}</Text>
      <View style={styles.gameResultTeams}>
        <Text style={styles.gameResultTeamText} numberOfLines={1} ellipsizeMode='tail'>{item.homeTeamName}</Text>
        <Text style={styles.gameResultTeamText} numberOfLines={1} ellipsizeMode='tail'>{item.awayTeamName}</Text>
      </View>
      <View style={styles.gameResultScores}>
        <Text style={styles.gameResultScoreText}>{item.status === 'completed' ? item.homeScore : '-'}</Text>
        <Text style={styles.gameResultScoreText}>{item.status === 'completed' ? item.awayScore : '-'}</Text>
      </View>
      <Text style={[styles.statusBadge, statusStyle]}>{item.status.replace('_', ' ')}</Text>
    </View>
  );
};
const PendingGameItem = ({ item, onResolve }) => {
  const gameDate = item.gameDate?.toDate();
  const formattedDate = gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let reason = "Unknown"; let reasonStyle = styles.reasonUnknown;
  const isDispute = item._isDispute === true; const isDelayed = item._isDelayed === true;
  if (isDispute) { reason = "Dispute"; reasonStyle = styles.reasonDispute; }
  else if (isDelayed) { reason = "Validation Delayed"; reasonStyle = styles.reasonDelayed; }
  return (
    <View style={styles.pendingGameRow}>
      <View style={styles.pendingGameInfo}>
        <Text style={styles.pendingGameTeams} numberOfLines={1} ellipsizeMode='tail'>{item.awayTeamName} @ {item.homeTeamName}</Text>
        <Text style={styles.pendingGameDate}>{formattedDate}</Text>
        <Text style={[styles.pendingGameReason, reasonStyle]}>{reason}</Text>
        {isDispute && (<Text style={styles.pendingGameScores}> Reported: H:{item.homeScore ?? '?'} A:{item.awayScore ?? '?'} </Text>)}
      </View>
      <TouchableOpacity onPress={() => onResolve(item)} style={styles.resolveButton}>
        <Text style={styles.resolveButtonText}>Resolve</Text>
      </TouchableOpacity>
    </View>
  );
};
const LeaderItem = ({ item }) => (
  <View style={styles.leaderRow}>
    <Text style={styles.leaderStat}>{item.stat}</Text>
    <Text style={styles.leaderName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
    <Text style={styles.leaderValue}>{item.value}</Text>
  </View>
);

// --- Componente Principal (MODIFICADO) ---
const OrganizerDashboardScreen = ({ route, navigation }) => {
  const { competitionId } = route.params;
  console.log("OrganizerDashboardScreen: Received competitionId prop:", competitionId);

  // --- Constantes para Web (ACTUALIZADO) ---
  const vercelURL = 'https://team-web-steel.vercel.app';
  const webDashboardUrl = `${vercelURL}/l/${competitionId}`;

  // --- Estados (CON UNA ADICIÓN) ---
  const [competition, setCompetition] = useState(null);
  const [loadingCompetition, setLoadingCompetition] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [games, setGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [pendingActionGames, setPendingActionGames] = useState([]);
  const [loadingPendingGames, setLoadingPendingGames] = useState(true);

  // --- ¡NUEVO ESTADO! ---
  const [isArchiving, setIsArchiving] = useState(false); // Para el botón de finalizar

  // --- Log Out / useLayoutEffect (SIN CAMBIOS) ---
  const handleLogout = () => { auth().signOut(); };
  useLayoutEffect(() => {
    navigation.setOptions({
      title: competition?.name || 'My Competition',
      headerTitleAlign: 'center',
      headerRight: () => (<Button onPress={handleLogout} title="Log Out" color="#ef4444" />),
    });
  }, [navigation, competition]);


  const handleUpdateLogo = () => {
    const currentUser = auth().currentUser; // Get current user for path
    if (!currentUser) return;

    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
      if (response.didCancel) return;
      if (response.errorCode) { Alert.alert('Error', response.errorMessage); return; }
      if (response.assets && response.assets.length > 0) {
        const uploadUri = response.assets[0].uri;
        let filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
        const extension = filename.split('.').pop();
        // CORRECTION: Use 'media_posts/{uid}/...' to pass Firebase Storage Rules
        const storagePath = `media_posts/${currentUser.uid}/league_logo/${competitionId}_${Date.now()}.${extension}`;
        try {
          const storageRef = storage().ref(storagePath);
          await storageRef.putFile(uploadUri);
          const url = await storageRef.getDownloadURL();
          await firestore().collection('competitions').doc(competitionId).update({ logoUrl: url });
          Alert.alert("Success", "League logo updated!");
        } catch (e) {
          console.error("Upload error details:", e);
          Alert.alert('Error', 'Could not upload image. Check permissions.');
        }
      }
    });
  };

  // --- useEffect (Listeners de Firestore) (SIN CAMBIOS) ... ---
  useEffect(() => {
    console.log("EFFECT: Fetching competition data...");
    if (!competitionId) {
      console.error("EFFECT: No competition ID received!"); setError('No competition ID was provided.');
      setLoadingCompetition(false); setLoadingTeams(false); setLoadingGames(false); setLoadingPendingGames(false); return;
    }
    const subscriber = firestore().collection('competitions').doc(competitionId)
      .onSnapshot(doc => {
        if (doc.exists) { console.log("EFFECT: Competition data FOUND:", doc.id); setCompetition({ id: doc.id, ...doc.data() }); setError(null); }
        else { console.error("EFFECT: Competition document NOT FOUND for ID:", competitionId); setError(`Competition with ID ${competitionId} not found.`); setCompetition(null); }
        setLoadingCompetition(false);
      }, err => { console.error('EFFECT: Error fetching competition:', err); setError('Could not load competition data.'); setCompetition(null); setLoadingCompetition(false); });
    return () => { console.log("EFFECT: Cleaning up competition listener."); subscriber(); };
  }, [competitionId]);

  useEffect(() => {
    if (!competitionId) return; console.log("EFFECT: Fetching teams list..."); setLoadingTeams(true);
    const teamsSubscriber = firestore().collection('competition_teams').where('competitionId', '==', competitionId).orderBy('joinedAt', 'asc')
      .onSnapshot(querySnapshot => {
        const fetchedTeams = querySnapshot.docs.map(doc => ({ id: doc.id, teamId: doc.data().teamId, name: doc.data().teamName }));
        console.log("EFFECT: Teams snapshot received, count:", fetchedTeams.length); setTeams(fetchedTeams); setLoadingTeams(false);
      }, err => { console.error('EFFECT: Error fetching teams:', err); setError(prev => prev || 'Could not load participating teams.'); setTeams([]); setLoadingTeams(false); });
    return () => { console.log("EFFECT: Cleaning up teams listener."); teamsSubscriber(); };
  }, [competitionId]);

  useEffect(() => {
    if (!competitionId) return; console.log("EFFECT: Fetching games list (results)..."); setLoadingGames(true);
    const gamesSubscriber = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('status', 'in', ['completed', 'pending_validation']).orderBy('gameDate', 'desc')
      .onSnapshot(querySnapshot => {
        const fetchedGames = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("EFFECT: Games (results) snapshot received, count:", fetchedGames.length); setGames(fetchedGames); setLoadingGames(false);
      }, err => { console.error('EFFECT: Error fetching games (results):', err); setError(prev => prev || 'Could not load game results. Check index.'); setGames([]); setLoadingGames(false); });
    return () => { console.log("EFFECT: Cleaning up games (results) listener."); gamesSubscriber(); };
  }, [competitionId]);

  useEffect(() => {
    if (!competitionId) { setLoadingPendingGames(false); return; } console.log("EFFECT: Fetching Pending Action games..."); setLoadingPendingGames(true); let initialLoadComplete = false;
    const delayThreshold = new Date(); delayThreshold.setDate(delayThreshold.getDate() - 1); const delayTimestamp = firestore.Timestamp.fromDate(delayThreshold);
    const disputesQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('status', '==', 'pending_validation').where('homeManagerValidated', '==', true).where('awayManagerValidated', '==', true);
    const delayedQuery = firestore().collection('competition_games').where('competitionId', '==', competitionId).where('status', '==', 'pending_validation').where('lastUpdated', '<', delayTimestamp);
    let pendingMap = {}; let disputesReceivedFirst = false; let delayedReceivedFirst = false;
    const updateState = () => {
      const actionItems = Object.values(pendingMap).filter(item => item._isDispute || item._isDelayed); console.log("EFFECT: Updating Pending Action state, count:", actionItems.length);
      setPendingActionGames(actionItems.sort((a, b) => (a.gameDate?.toDate() || 0) - (b.gameDate?.toDate() || 0)));
      if (disputesReceivedFirst && delayedReceivedFirst && !initialLoadComplete) { console.log("EFFECT: Both pending listeners responded. Setting loadingPendingGames to false."); setLoadingPendingGames(false); initialLoadComplete = true; }
      else if (!initialLoadComplete) { console.log("EFFECT: Waiting for first response from both pending listeners..."); }
      else if (initialLoadComplete) { setLoadingPendingGames(false); }
    };
    const disputesListener = disputesQuery.onSnapshot(snapshot => {
      console.log("EFFECT: Disputes snapshot received, size:", snapshot.size); let changed = false; const currentDisputeIds = new Set();
      snapshot.docs.forEach(doc => { currentDisputeIds.add(doc.id); if (!pendingMap[doc.id] || !pendingMap[doc.id]._isDispute) changed = true; pendingMap[doc.id] = { ...(pendingMap[doc.id] || {}), id: doc.id, ...doc.data(), _isDispute: true }; });
      Object.keys(pendingMap).forEach(id => { if (pendingMap[id]._isDispute && !currentDisputeIds.has(id)) { pendingMap[id]._isDispute = false; changed = true; } });
      disputesReceivedFirst = true; if (changed || !initialLoadComplete) updateState(); else if (initialLoadComplete) setLoadingPendingGames(false);
    }, err => { console.error("Error fetching disputes:", err); setError(prev => prev || 'Could not load disputes. Check Index.'); disputesReceivedFirst = true; updateState(); });
    const delayedListener = delayedQuery.onSnapshot(snapshot => {
      console.log("EFFECT: Delayed snapshot received, size:", snapshot.size); let changed = false; const currentDelayedIds = new Set();
      snapshot.docs.forEach(doc => { const data = doc.data(); const isTrulyDelayed = (data.homeManagerValidated && !data.awayManagerValidated) || (!data.homeManagerValidated && data.awayManagerValidated); if (isTrulyDelayed) { currentDelayedIds.add(doc.id); if (!pendingMap[doc.id] || !pendingMap[doc.id]._isDelayed) changed = true; pendingMap[doc.id] = { ...(pendingMap[doc.id] || {}), id: doc.id, ...data, _isDelayed: true }; } });
      Object.keys(pendingMap).forEach(id => { if (pendingMap[id]._isDelayed && !currentDelayedIds.has(id)) { pendingMap[id]._isDelayed = false; changed = true; } });
      delayedReceivedFirst = true; if (changed || !initialLoadComplete) updateState(); else if (initialLoadComplete) setLoadingPendingGames(false);
    }, err => { console.error("Error fetching delayed games:", err); setError(prev => prev || 'Could not load delayed games. Check Index.'); delayedReceivedFirst = true; updateState(); });
    return () => { console.log("EFFECT: Cleaning up pending games listeners."); disputesListener(); delayedListener(); };
  }, [competitionId]);

  // --- useMemo (Standings / Leaders) (SIN CAMBIOS) ... ---
  const standings = useMemo(() => {
    console.log("MEMO: Calculating standings..."); const standingsMap = {};
    teams.forEach(t => { standingsMap[t.teamId] = { id: t.teamId, name: t.name, W: 0, L: 0, T: 0, GP: 0 }; });
    const completedGames = games.filter(g => g.status === 'completed');
    completedGames.forEach(g => { const hId = g.homeTeamId, aId = g.awayTeamId, hS = g.homeScore, aS = g.awayScore; if (!standingsMap[hId]) standingsMap[hId] = { id: hId, name: g.homeTeamName, W: 0, L: 0, T: 0, GP: 0 }; if (!standingsMap[aId]) standingsMap[aId] = { id: aId, name: g.awayTeamName, W: 0, L: 0, T: 0, GP: 0 }; standingsMap[hId].GP++; standingsMap[aId].GP++; if (hS > aS) { standingsMap[hId].W++; standingsMap[aId].L++; } else if (aS > hS) { standingsMap[aId].W++; standingsMap[hId].L++; } else { standingsMap[hId].T++; standingsMap[aId].T++; } });
    const result = Object.values(standingsMap).sort((a, b) => b.W - a.W || a.L - b.L || b.T - a.T);
    console.log("MEMO: Standings calculation finished, count:", result.length); return result;
  }, [games, teams]);
  const leagueLeadersData = useMemo(() => {
    console.log("MEMO: Calculating League Leaders..."); const statsMap = {}; const completedGames = games.filter(g => g.status === 'completed');
    console.log("MEMO: Found", completedGames.length, "completed games for leaders calc.");
    completedGames.forEach(game => { const processBoxScore = (boxScore, teamName) => { if (boxScore && Array.isArray(boxScore)) { boxScore.forEach(playerStat => { const key = playerStat.id || playerStat.playerName; if (!key) return; if (!statsMap[key]) { statsMap[key] = { id: key, playerName: playerStat.playerName || playerStat.name || 'Unknown', teamName: teamName, ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0, k: 0 }; } statsMap[key].teamName = teamName; statsMap[key].ab += (playerStat.game_ab || 0); statsMap[key].hits += (playerStat.game_hits || 0); statsMap[key].doubles += (playerStat.game_doubles || 0); statsMap[key].triples += (playerStat.game_triples || 0); statsMap[key].homeruns += (playerStat.game_homeruns || 0); statsMap[key].walks += (playerStat.game_walks || 0); statsMap[key].k += (playerStat.game_k || 0); }); } }; processBoxScore(game.homeBoxScore, game.homeTeamName); processBoxScore(game.awayBoxScore, game.awayTeamName); });
    const aggregatedStats = Object.values(statsMap).map(p => ({ ...p, avg: calculateAvg(p.hits, p.ab) }));
    console.log("MEMO: Aggregated stats count:", aggregatedStats.length); const minABForAVG = 1; const qualifiedPlayersAVG = aggregatedStats.filter(p => (p.ab || 0) >= minABForAVG);
    const leaders = [getLeaders("AVG", qualifiedPlayersAVG, p => (p.hits || 0) / (p.ab || 1), true), getLeaders("H", aggregatedStats, p => p.hits || 0, false, "Hits"), getLeaders("HR", aggregatedStats, p => p.homeruns || 0, false, "HRs"), getLeaders("BB", aggregatedStats, p => p.walks || 0, false, "Walks"), getLeaders("K", aggregatedStats, p => p.k || 0),];
    console.log("MEMO: Leaders calculation finished:", leaders); return leaders;
  }, [games]);

  // --- Funciones Share / Resolve / Web (SIN CAMBIOS) ---
  const handleShareCode = async () => { if (!competition?.inviteCode) return; try { await Share.share({ message: `Join competition "${competition.name}"! Code: ${competition.inviteCode}` }); } catch (e) { Alert.alert('Error', 'Could not share code.'); } };
  const handleResolveGame = (game) => { navigation.navigate('ResolveGame', { gameId: game.id, competitionId: competitionId }); };
  const handleViewTeams = () => { Alert.alert("View Teams", "Functionality to view/manage teams is pending implementation."); };
  const handleOpenWebDashboard = async () => {
    if (!competitionId) {
      Alert.alert("Error", "Cannot open web dashboard without a competition ID.");
      return;
    }
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


  // --- ¡NUEVA FUNCIÓN! (AHORA 100% EN INGLÉS) ---
  const handleArchiveTournament = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser || !competitionId) {
      // Mensaje de error que señalaste, ahora en inglés
      Alert.alert("Error", "Could not find user or tournament information.");
      return;
    }

    // 1. Confirmar con el usuario (EN INGLÉS)
    Alert.alert(
      "Finalize Tournament", // Título
      "Are you sure you want to finalize and archive this tournament? This action cannot be undone.\n\n(You will be able to create a new tournament after this.)", // Mensaje
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Finalize", // Botón de confirmación
          style: "destructive",
          onPress: async () => {
            setIsArchiving(true);
            try {
              // 2. Crear un batch de Firestore
              const batch = firestore().batch();

              // 3. Tarea 1: Actualizar el torneo (marcarlo como completado)
              const tournamentRef = firestore().collection('competitions').doc(competitionId);
              batch.update(tournamentRef, {
                status: 'completed',
                archivedAt: firestore.FieldValue.serverTimestamp(),
              });

              // 4. Tarea 2: Desvincular al usuario (¡Esta es la parte clave!)
              const userRef = firestore().collection('users').doc(currentUser.uid);
              batch.update(userRef, {
                competitionId: firestore.FieldValue.delete(), // Borra el campo
              });

              // 5. Ejecutar ambas tareas
              await batch.commit();

              // ¡Éxito! (EN INGLÉS)
              Alert.alert("Tournament Archived", "This tournament has been finalized and archived.");

            } catch (err) {
              console.error("Error archiving tournament: ", err);
              // Mensaje de error (EN INGLÉS)
              Alert.alert("Error", "Could not archive tournament. Please try again.");
            } finally {
              setIsArchiving(false);
            }
          },
        },
      ]
    );
  };


  // --- isLoading general (SIN CAMBIOS) ---
  const isLoadingInitial = loadingCompetition || loadingTeams;
  console.log("RENDER: isLoading flags:", { loadingCompetition, loadingTeams, loadingGames, loadingPendingGames });
  console.log("RENDER: Current error state:", error);

  // --- Renderizado Condicional Inicial (SIN CAMBIOS) ---
  if (isLoadingInitial && !competition && teams.length === 0 && !error) { console.log("RENDER: Showing initial loading indicator."); return <View style={styles.center}><ActivityIndicator size="large" /></View>; }
  if (error && !competition) { console.log("RENDER: Showing full error screen (no competition data)."); return (<SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.errorText}>{error}</Text></View></SafeAreaView>); }
  if (!competition && !isLoadingInitial && !error) { console.log("RENDER: Showing 'No competition data found' screen."); return <View style={styles.center}><Text style={styles.emptyText}>No competition data found.</Text></View>; }

  // --- Renderizado Principal (MODIFICADO EL INFO CARD) ---
  console.log("RENDER: Rendering main dashboard content.");
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* --- LOGO MOVED TO TOP --- */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
          <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#e5e7eb', elevation: 5 }}>
            {competition.logoUrl ? (
              <Image source={{ uri: competition.logoUrl }} style={{ width: '100%', height: '100%' }} />
            ) : (
              <Text style={{ fontSize: 40 }}>🏆</Text>
            )}
          </View>
          <TouchableOpacity onPress={handleUpdateLogo} style={{ position: 'absolute', bottom: 0, right: '35%', backgroundColor: 'white', padding: 8, borderRadius: 20, elevation: 4 }}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
        </View>

        {error && <View style={styles.errorBanner}><Text style={styles.errorBannerText}>{error}</Text></View>}
        {(loadingGames || loadingPendingGames) && !error && competition && (<View style={styles.loadingSection}><ActivityIndicator /><Text style={styles.loadingText}> Loading sections...</Text></View>)}

        {/* 1. Tabla de Posiciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standings</Text>
          <View style={[styles.standingRow, styles.standingHeaderRow]}>
            <Text style={[styles.standingCell, styles.rankCell, styles.standingHeaderText]}>#</Text>
            <Text style={[styles.standingCell, styles.teamNameCell, styles.standingHeaderText]}>Team</Text>
            <Text style={[styles.standingCell, styles.standingHeaderText]}>GP</Text>
            <Text style={[styles.standingCell, styles.standingHeaderText]}>W</Text><Text style={[styles.standingCell, styles.standingHeaderText]}>L</Text><Text style={[styles.standingCell, styles.standingHeaderText]}>T</Text>
          </View>
          {loadingTeams || loadingGames ? (<ActivityIndicator style={{ marginVertical: 10 }} />)
            : standings.length > 0 ? (<FlatList data={standings} keyExtractor={(item) => item.id} renderItem={({ item, index }) => <StandingItem item={item} index={index} />} scrollEnabled={false} />)
              : (<Text style={styles.emptyListText}>No standings available yet.</Text>)}
        </View>

        {/* 2. Líderes de Liga */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>League Leaders</Text>
          {loadingGames ? (<ActivityIndicator style={{ marginVertical: 10 }} />)
            : leagueLeadersData && leagueLeadersData.length > 0 ? (leagueLeadersData.map(leader => <LeaderItem key={leader.stat} item={leader} />))
              : (<Text style={styles.emptyListText}>Not enough data for leaders yet.</Text>)}
        </View>

        {/* 3. Resultados de Juegos (Últimos 8) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Game Results</Text>
          {loadingGames ? (<ActivityIndicator style={{ marginVertical: 10 }} />)
            : games.length > 0 ? (<FlatList data={games.slice(0, 8)} keyExtractor={(item) => item.id} renderItem={({ item }) => <GameResultItem item={item} />} scrollEnabled={false} />)
              : (<Text style={styles.emptyListText}>No games played or pending validation.</Text>)}
        </View>

        {/* Sección Pendientes de Acción */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Action ({loadingPendingGames ? '...' : pendingActionGames.length})</Text>
          {loadingPendingGames ? (<ActivityIndicator style={{ marginVertical: 10 }} />)
            : pendingActionGames.length > 0 ? (<FlatList data={pendingActionGames} keyExtractor={(item) => item.id} renderItem={({ item }) => <PendingGameItem item={item} onResolve={handleResolveGame} />} scrollEnabled={false} />)
              : (<Text style={styles.emptyListText}>No games require immediate action.</Text>)}
        </View>

        {/* --- BOTÓN DE ELIMINAR DENTRO DEL SCROLLVIEW (AL FINAL) --- */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#ef4444', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginTop: 10 }}
            onPress={handleDeleteAccount}
          >
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Espaciador para que el botón no quede tapado por el footer fijo */}
        <View style={{ height: 180 }} />

      </ScrollView>

      {/* 5. Info Card (FIXED FOOTER - Restaurado a su posición original) */}
      {competition && (
        <View style={styles.infoCard}>

          {/* 1. Contenedor de Invite Code */}
          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>Invite Code:</Text>
            <Text style={styles.inviteCodeValue}>{competition.inviteCode}</Text>
            <TouchableOpacity onPress={handleShareCode} style={styles.shareButton} disabled={isArchiving}>
              <Text style={styles.shareButtonText}>🔗 Share</Text>
            </TouchableOpacity>
          </View>

          {/* 2. ¡BOTÓN PARA WEB DASHBOARD! */}
          <TouchableOpacity
            style={[styles.viewTeamsButton, { marginTop: 10, backgroundColor: '#10B981' }]}
            onPress={handleOpenWebDashboard}
            disabled={isArchiving}
          >
            <Text style={[styles.viewTeamsButtonText, { color: '#FFFFFF' }]}>
              📊 View Web Dashboard
            </Text>
          </TouchableOpacity>

          {/* 3. ¡NUEVO BOTÓN PARA FINALIZAR TORNEO! (EN INGLÉS) */}
          <TouchableOpacity
            style={[styles.viewTeamsButton, { marginTop: 10, backgroundColor: isArchiving ? '#fca5a5' : '#ef4444' }]} // Color rojo
            onPress={handleArchiveTournament}
            disabled={isArchiving}
          >
            {isArchiving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.viewTeamsButtonText, { color: '#FFFFFF' }]}>
                🛑 Finalize & Archive Tournament
              </Text>
            )}
          </TouchableOpacity>

        </View>
      )}
    </SafeAreaView>
  );
}; // Fin OrganizerDashboardScreen

// --- Estilos (SIN CAMBIOS) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoCard: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingBottom: 25 }, // Añadí más paddingBottom
  competitionNameHeader: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', paddingVertical: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  inviteCodeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef2ff', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, width: '100%' },
  inviteCodeLabel: { fontSize: 16, color: '#4338ca', marginRight: 5 },
  inviteCodeValue: { fontSize: 18, color: '#4338ca', fontWeight: 'bold', flexShrink: 1, marginRight: 10 },
  shareButton: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  shareButtonText: { color: 'white', fontSize: 14, fontWeight: '500' },
  section: { marginHorizontal: 16, marginTop: 20, backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 2 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 },
  listContainer: {},
  teamItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  teamName: { fontSize: 16, color: '#374151' },
  emptyListText: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingVertical: 10 },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  standingRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', alignItems: 'center' },
  standingHeaderRow: { backgroundColor: '#f9fafb', borderBottomWidth: 2, borderBottomColor: '#e5e7eb', paddingVertical: 8 },
  standingCell: { fontSize: 14, textAlign: 'center', color: '#374151', flex: 1 }, // Default flex 1
  rankCell: { flex: 0.5, fontWeight: 'bold' }, // Más pequeño
  teamNameCell: { flex: 2.5, textAlign: 'left', paddingLeft: 5, fontWeight: 'bold' }, // Más grande
  standingHeaderText: { fontWeight: 'bold', color: '#4b5563' },
  gameResultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', },
  gameResultDate: { fontSize: 12, color: '#6b7280', width: 60, textAlign: 'center', marginRight: 5, },
  gameResultTeams: { flex: 3, paddingHorizontal: 5, justifyContent: 'center', },
  gameResultTeamText: { fontSize: 14, color: '#1f2937', },
  gameResultScores: { width: 35, alignItems: 'center', paddingHorizontal: 0, marginHorizontal: 5, },
  gameResultScoreText: { fontSize: 14, fontWeight: 'bold', color: '#1f2937', },
  statusBadge: { fontSize: 10, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', textAlign: 'center', minWidth: 75, marginLeft: 5, textTransform: 'capitalize' },
  status_scheduled: { backgroundColor: '#e0e7ff', color: '#4f46e5' },
  status_pending_validation: { backgroundColor: '#fef3c7', color: '#d97706' },
  status_completed: { backgroundColor: '#e5e7eb', color: '#4b5563' },
  status_unknown: { backgroundColor: '#f3f4f6', color: '#6b7280' },
  errorBanner: { backgroundColor: '#fee2e2', padding: 10, marginHorizontal: 16, marginTop: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fca5a5' },
  errorBannerText: { color: '#b91c1c', fontSize: 14, textAlign: 'center' },
  pendingGameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  pendingGameInfo: { flex: 1, marginRight: 10 },
  pendingGameTeams: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  pendingGameDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  pendingGameScores: { fontSize: 12, color: '#4b5563', marginTop: 3, fontStyle: 'italic' },
  pendingGameReason: { fontSize: 12, fontWeight: 'bold', marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', alignSelf: 'flex-start' },
  reasonDispute: { backgroundColor: '#fef3c7', color: '#b45309' },
  reasonDelayed: { backgroundColor: '#ffedd5', color: '#c2410c' },
  reasonUnknown: { backgroundColor: '#e5e7eb', color: '#4b5563' },
  resolveButton: { backgroundColor: '#fbbf24', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  resolveButtonText: { color: '#78350f', fontWeight: 'bold', fontSize: 14 },
  loadingSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, marginTop: 10 },
  loadingText: { marginLeft: 10, color: '#6b7280' },
  leaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  leaderStat: { fontWeight: 'bold', color: '#3b82f6', flex: 1, fontSize: 14, },
  leaderName: { flex: 3, textAlign: 'left', paddingHorizontal: 5, fontSize: 14, color: '#374151', },
  leaderValue: { fontWeight: 'bold', flex: 1, textAlign: 'right', fontSize: 14, color: '#1f2937', },
  viewTeamsButton: { backgroundColor: '#e0e7ff', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 5, },
  viewTeamsButtonText: { color: '#4f46e5', fontSize: 16, fontWeight: '600', },
});

export default OrganizerDashboardScreen;