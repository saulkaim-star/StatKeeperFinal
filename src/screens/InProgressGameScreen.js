
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert, // <--- Alert se usa mucho ahora
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';


// --- Constantes y Funciones Auxiliares (Sin cambios) ---
const ABBREVIATIONS = [
    { abbr: '1B', meaning: 'Single' }, { abbr: '2B', meaning: 'Double' },
    { abbr: '3B', meaning: 'Triple' }, { abbr: 'HR', meaning: 'Home Run' },
    { abbr: 'BB', meaning: 'Walk (Base on Balls)' }, { abbr: 'HBP', meaning: 'Hit By Pitch' },
    { abbr: 'SAC', meaning: 'Sacrifice' }, { abbr: 'E', meaning: 'Reached on Error' },
    { abbr: 'OUT', meaning: 'In-Play Out' }, { abbr: 'K', meaning: 'Strikeout' },
    { abbr: 'DP', meaning: 'Double Play' }, { abbr: 'TP', meaning: 'Triple Play' },
    { abbr: 'Sustitución', meaning: 'Substitute Player'}, { abbr: 'OB', meaning: 'Out on Base' },
    { abbr: 'UNDO', meaning: 'Undo Last Action' }
];
const initializeGameStats = lineup => {
    if (!lineup) return [];
    return lineup.map(player => ({
    ...(player || {}),
    game_ab: 0, game_hits: 0, game_walks: 0, game_k: 0, game_hbp: 0,
    game_doubles: 0, game_triples: 0, game_homeruns: 0,
  }));
};

const InProgressGameScreen = ({ route, navigation }) => {
  // --- Estados (Sin cambios) ---
  const {
    teamId, opponentName: initialOpponentName, locationStatus, lineup, fullRoster,
    isLeagueGame, leagueGameId, competitionId,
  } = route.params;
  const currentUser = auth().currentUser;
  const STORAGE_KEY = useMemo(() => 
    `@InProgressGame:${leagueGameId || teamId || 'default'}`, 
    [leagueGameId, teamId]
  );
  const [myTeamName, setMyTeamName] =useState('My Team');
  const [opponentName, setOpponentName] = useState(initialOpponentName || 'Opponent');
  const [activeLineup, setActiveLineup] = useState([]);
  const [boxScoreDisplay, setBoxScoreDisplay] = useState([]);
  const [currentBatterIndex, setCurrentBatterIndex] = useState(0);
  const [outs, setOuts] = useState(0);
  const [inning, setInning] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const lastAction = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [substitutionModalVisible, setSubstitutionModalVisible] = useState(false);
  const [playerToSubOut, setPlayerToSubOut] = useState(null);
  const [playerToSubIn, setPlayerToSubIn] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- useEffect (Carga y Guardado en AsyncStorage) (Sin cambios) ---
  useEffect(() => {
    setIsLoadingData(true);
    let isMounted = true;
    const loadInitialData = async () => {
        try {
            const savedGameJSON = await AsyncStorage.getItem(STORAGE_KEY);
            if (savedGameJSON && isMounted) {
                console.log("Found saved game in AsyncStorage! Loading...");
                const savedState = JSON.parse(savedGameJSON);
                setMyTeamName(savedState.myTeamName);
                setOpponentName(savedState.opponentName);
                setActiveLineup(savedState.activeLineup);
                setBoxScoreDisplay(savedState.boxScoreDisplay);
                setCurrentBatterIndex(savedState.currentBatterIndex);
                setOuts(savedState.outs);
                setInning(savedState.inning);
                setMyScore(savedState.myScore);
                setOpponentScore(savedState.opponentScore);
                lastAction.current = savedState.lastAction_current; 
                setCanUndo(!!savedState.lastAction_current); 
                console.log("Game state restored from AsyncStorage.");
            } else {
                console.log("No saved game found. Loading from Firestore...");
                const teamDoc = await firestore().collection('teams').doc(teamId).get();
                if (teamDoc.exists && isMounted) { setMyTeamName(teamDoc.data().teamName || 'My Team'); }
                let finalLineup = []; let finalOpponentName = initialOpponentName || 'Opponent';
                let initialMyScore = 0; let initialOpponentScore = 0; let initialInning = 1; let initialOuts = 0;
                if (isLeagueGame && leagueGameId) {
                    const gameDoc = await firestore().collection('competition_games').doc(leagueGameId).get();
                    if (gameDoc.exists) {
                        const gameData = gameDoc.data();
                        if (!gameData) { throw new Error("gameData is undefined"); }
                        const isHome = gameData.homeTeamId === teamId;
                        finalOpponentName = isHome ? gameData.awayTeamName : gameData.homeTeamName;
                        initialMyScore = 0;
                        initialOpponentScore = 0;
                        if (lineup && lineup.length > 0) { finalLineup = lineup; }
                        else { console.warn("League game started without lineup data!"); finalLineup = []; }
                    } else { throw new Error("League game not found."); }
                } else {
                     if (lineup && lineup.length > 0) { finalLineup = lineup; }
                     else { throw new Error("Lineup is required."); }
                }
                if (isMounted) {
                    setOpponentName(finalOpponentName); setMyScore(initialMyScore); setOpponentScore(initialOpponentScore);
                    setInning(initialInning); setOuts(initialOuts);
                    const initializedStats = initializeGameStats(finalLineup);
                    if (!initializedStats || initializedStats.length === 0) { throw new Error("Failed to initialize player stats."); }
                    setActiveLineup(initializedStats); setBoxScoreDisplay(initializedStats); setCurrentBatterIndex(0);
                }
            }
        } catch (error) {
            console.error("Error loading initial game data:", error);
            if(isMounted) Alert.alert("Error", `Could not load initial game data: ${error.message}`);
        } finally {
             if(isMounted) setIsLoadingData(false);
        }
    };
    loadInitialData();
    return () => { isMounted = false; };
  }, [teamId, isLeagueGame, leagueGameId, lineup, initialOpponentName, STORAGE_KEY]); 

  useEffect(() => {
    if (isLoadingData || activeLineup.length === 0) {
      return;
    }
    const saveGameState = async () => {
      console.log("Saving game state to AsyncStorage...");
      const currentState = {
        myTeamName,
        opponentName,
        activeLineup,
        boxScoreDisplay,
        currentBatterIndex,
        outs,
        inning,
        myScore,
        opponentScore,
        lastAction_current: lastAction.current, 
      };
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentState));
      } catch (e) {
        console.error("Failed to save game state to AsyncStorage", e);
      }
    };
    saveGameState();
  }, [
      activeLineup, boxScoreDisplay, currentBatterIndex, outs, inning, 
      myScore, opponentScore, myTeamName, opponentName, 
      canUndo, 
      STORAGE_KEY, isLoadingData
  ]);
  
  // --- Variables calculadas (Sin cambios) ---
  const currentBatter = (!isLoadingData && activeLineup && activeLineup.length > 0) ? activeLineup[currentBatterIndex] : null;
  const benchPlayers = fullRoster ? fullRoster.filter(p => p && p.id && !boxScoreDisplay.some(lineupPlayer => lineupPlayer && lineupPlayer.id === p.id)) : [];
  const finalBoxScore = useMemo(() => {
        return boxScoreDisplay.map(player => {
            if (!player) return {};
            const ab = player.game_ab || 0; const hits = player.game_hits || 0;
            const avg = ab > 0 ? (hits / ab).toFixed(3).replace(/^0/, '') : '.000';
            return { ...player, avg };
        })
   }, [boxScoreDisplay]);

  // --- Funciones de Sustitución (Sin cambios) ---
  const handleConfirmSubstitution = () => {
        if (!playerToSubIn || !playerToSubOut || !playerToSubIn.id) { Alert.alert("Error", "Invalid player selection."); return; }
        const newPlayerWithStats = initializeGameStats([playerToSubIn])[0];
        const activeIndex = activeLineup.findIndex(p => p && p.id === playerToSubOut.id);
        if (activeIndex === -1) { Alert.alert("Error", "Player not in active lineup."); return; }
        const newActiveLineup = [...activeLineup]; newActiveLineup[activeIndex] = newPlayerWithStats; setActiveLineup(newActiveLineup);
        if (!boxScoreDisplay.some(p => p && p.id === newPlayerWithStats.id)) { setBoxScoreDisplay(prev => [...prev, newPlayerWithStats]); }
        if (playerToSubOut.id === currentBatter?.id) { console.log("Substituted current batter."); }
        closeSubstitutionModal();
   };
  const closeSubstitutionModal = () => { setSubstitutionModalVisible(false); setPlayerToSubOut(null); setPlayerToSubIn(null); };

  // --- Funciones de Anotación (handleUndo/recordAction sin cambios) ---
   const handleNextBatter = () => { if (activeLineup.length > 0) { setCurrentBatterIndex(prev => (prev + 1) % activeLineup.length); } };
   const recordAction = (localUpdates, outCount = 0, advancesBatter = true) => {
       if (!currentBatter || !currentBatter.id) { console.error("recordAction: currentBatter is invalid!"); return; }
       lastAction.current = { batterId: currentBatter.id, batterIndex: currentBatterIndex, previousOuts: outs, localUpdates, advancesBatter }; setCanUndo(true);
       const updatePlayerStats = (current, batterId, updates) => current.map(p => p && p.id === batterId ? { ...p, ...Object.keys(updates).reduce((acc, key) => ({ ...acc, [key]: (p[key] || 0) + updates[key] }), {}) } : p);
       setActiveLineup(current => updatePlayerStats(current, currentBatter.id, localUpdates));
       setBoxScoreDisplay(current => updatePlayerStats(current, currentBatter.id, localUpdates));
       if (outCount > 0) addOuts(outCount);
       if (advancesBatter && activeLineup.length > 0) handleNextBatter();
   };
   const handleUndo = () => {
        if (!lastAction.current) return;
        const { batterId, batterIndex, previousOuts, localUpdates, advancesBatter } = lastAction.current;
        const undoPlayerStats = (current, pId, updates) => current.map(p => p && p.id === pId ? { ...p, ...Object.keys(updates).reduce((acc, key) => ({ ...acc, [key]: (p[key] || 0) - updates[key] }), {}) } : p);
        setActiveLineup(current => undoPlayerStats(current, batterId, localUpdates)); setBoxScoreDisplay(current => undoPlayerStats(current, batterId, localUpdates));
        if (advancesBatter) setCurrentBatterIndex(batterIndex);
        setOuts(previousOuts); lastAction.current = null; setCanUndo(false);
   };

  // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
  // --- LÓGICA DE 3 OUTS (CORREGIDA Y LIMPIA) ---
  const addOuts = (count = 1) => {
    setOuts(prevOuts => {
        const newOuts = prevOuts + count;
        if (newOuts >= 3) {
            
            setTimeout(() => {
                Alert.alert(
                    "3 Outs: Half-Inning Over", // Título
                    "Please update the score using the ▲/▼ buttons.", // Mensaje
                    [ // <-- Este array [ ] es el que estaba roto
                        { 
                            text: "OK", 
                            onPress: () => {
                                setInning(prevInning => prevInning + 1);
                                setOuts(0);
                            }
                        }
                    ],
                    { cancelable: false }
                );
            }, 300); 
        }
        return newOuts;
    });
  };
  // --- FIN DE LA CORRECCIÓN ---


  // --- saveGameToFirestore (Sin cambios en su lógica interna) ---
  const saveGameToFirestore = async (finalMyScore, finalOpponentScore) => {
    console.log("saveGameToFirestore called. isLeagueGame:", isLeagueGame);
    setIsSaving(true);
    if (isLeagueGame && leagueGameId) {
      try {
        const gameRef = firestore().collection('competition_games').doc(leagueGameId);
        const isHome = locationStatus === 'home';
        await firestore().runTransaction(async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists) { throw new Error("Game document not found!"); }
          const gameData = gameDoc.data();
          let myUpdateData = {
            status: 'pending_validation', 
            ...(isHome 
                ? { homeScore: finalMyScore, awayScore: finalOpponentScore, homeBoxScore: boxScoreDisplay, homeManagerValidated: true }
                : { awayScore: finalMyScore, homeScore: finalOpponentScore, awayBoxScore: boxScoreDisplay, awayManagerValidated: true }
            ),
            lastUpdated: firestore.FieldValue.serverTimestamp(),
          };
          const otherManagerFlag = isHome ? gameData.awayManagerValidated : gameData.homeManagerValidated;
          if (otherManagerFlag === true) {
            console.log("Other manager has already validated. Checking scores...");
            const otherManagerReportedMyScore = isHome ? gameData.homeScore : gameData.awayScore;
            const otherManagerReportedHisScore = isHome ? gameData.awayScore : gameData.homeScore;
            if (finalMyScore === otherManagerReportedMyScore && finalOpponentScore === otherManagerReportedHisScore) {
              console.log("Validation SUCCESS: Scores match.");
              myUpdateData.status = 'completed';
            } else {
              console.warn(`Validation FAILED: Scores do not match.`);
              myUpdateData.status = 'pending_validation'; 
            }
          } else {
            console.log("I am the first manager to submit. Waiting for opponent.");
          }
          transaction.update(gameRef, myUpdateData);
        });
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log("League game saved to Firestore, clearing AsyncStorage.");
        Alert.alert('Game Submitted', 'Result submitted for validation.');
        navigation.navigate('ManagerTabs', { screen: 'Stats' });
      } catch (error) { 
        console.error("Error updating league game:", error); 
        Alert.alert("Error", `Could not submit league game result: ${error.message}`); 
        setIsSaving(false); 
      }
    } else if (!isLeagueGame) {
      const finalGameData = { opponentName, locationStatus, myScore: finalMyScore, opponentScore: finalOpponentScore, date: firestore.FieldValue.serverTimestamp(), boxScore: boxScoreDisplay, status: 'completed' };
      const batch = firestore().batch();
      const gameRef = firestore().collection('teams').doc(teamId).collection('games').doc(); batch.set(gameRef, finalGameData);
      boxScoreDisplay.forEach(playerStat => {
        if (playerStat && playerStat.id) {
          const playerRef = firestore().collection('teams').doc(teamId).collection('roster').doc(playerStat.id);
          const updates = { ab: firestore.FieldValue.increment(playerStat.game_ab || 0), hits: firestore.FieldValue.increment(playerStat.game_hits || 0), walks: firestore.FieldValue.increment(playerStat.game_walks || 0), k: firestore.FieldValue.increment(playerStat.game_k || 0), doubles: firestore.FieldValue.increment(playerStat.game_doubles || 0), triples: firestore.FieldValue.increment(playerStat.game_triples || 0), homeruns: firestore.FieldValue.increment(playerStat.game_homeruns || 0) };
          batch.update(playerRef, updates);
        }
      });
      batch.commit().then(async () => { 
        await AsyncStorage.removeItem(STORAGE_KEY);
        console.log("Private game saved to Firestore, clearing AsyncStorage.");
        Alert.alert('Game Over', 'Result saved and player stats updated!'); 
        navigation.navigate('ManagerTabs', { screen: 'Stats' }); 
      }).catch(error => { Alert.alert("Error", "Could not save game and update stats."); console.error("Save error: ", error); setIsSaving(false); });
    } else { 
      Alert.alert("Error", "Game type could not be determined."); 
      setIsSaving(false); 
    }
  };


  // --- LÓGICA DE END GAME (MODIFICADA) ---
  const handleEndGame = () => {
      Alert.alert(
          "Confirm Final Score", 
          `Please check the final score with the opposing manager before saving.\n\n${myTeamName}: ${myScore}\n${opponentName}: ${opponentScore}`,
          [ 
              { text: "Cancel", style: "cancel" },
              { 
                text: "Confirm & Save", 
                onPress: () => saveGameToFirestore(myScore, opponentScore)
              } 
          ]
      );
  };

  // --- Funciones de Acciones (Sin cambios) ---
  const handleSingle = () => recordAction({game_ab: 1, game_hits: 1});
  const handleDouble = () => recordAction({game_ab: 1, game_hits: 1, game_doubles: 1});
  const handleTriple = () => recordAction({game_ab: 1, game_hits: 1, game_triples: 1});
  const handleHomeRun = () => recordAction({game_ab: 1, game_hits: 1, game_homeruns: 1});
  const handleWalk = () => recordAction({game_walks: 1});
  const handleHBP = () => recordAction({game_hbp: 1});
  const handleOut = () => recordAction({game_ab: 1}, 1);
  const handleStrikeout = () => recordAction({game_ab: 1, game_k: 1}, 1);
  const handleError = () => recordAction({game_ab: 1});
  const handleSacrifice = () => recordAction({}, 1);
  const handleDoublePlay = () => recordAction({game_ab: 1}, 2);
  const handleTriplePlay = () => recordAction({game_ab: 1}, 3);
  const handleOutOnBase = () => recordAction({}, 1, false);

  // --- Renderizado Condicional de Carga (Sin cambios) ---
  if (isLoadingData) {
      return <SafeAreaView style={styles.container}><View style={styles.centerView}><ActivityIndicator size="large" color="#333" /></View></SafeAreaView>;
  }

  // --- Renderizado Principal (JSX COMPLETO) ---
  return (
    <SafeAreaView style={styles.container}>
        
        <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />
        

        {/* Modal Sustitución (Sin cambios) */}
         <Modal visible={substitutionModalVisible} transparent={true} animationType="fade" onRequestClose={closeSubstitutionModal}>
            <View style={styles.centeredView}><View style={styles.modalView}>
                <Text style={styles.modalText}>Player Substitution</Text>
                <View style={styles.substitutionContainer}>
                    <View style={styles.substitutionColumn}>
                        <Text style={styles.columnHeader}>Select Player to Remove</Text>
                        <ScrollView>{activeLineup.map((item) => ( item && item.id ? <TouchableOpacity key={`out-${item.id}`} style={[ styles.playerSelectItem, playerToSubOut?.id === item.id && styles.playerSelected ]} onPress={() => setPlayerToSubOut(item)}><Text style={ playerToSubOut?.id === item.id ? styles.playerSelectedText : styles.playerNormalText }>{item.playerName || item.name}</Text></TouchableOpacity> : null ))}</ScrollView>
                    </View>
                    <View style={styles.substitutionColumn}>
                        <Text style={styles.columnHeader}>Select Replacement</Text>
                        <ScrollView>{benchPlayers.length > 0 ? ( benchPlayers.map((item) => ( item && item.id ? <TouchableOpacity key={`in-${item.id}`} style={[ styles.playerSelectItem, playerToSubIn?.id === item.id && styles.playerSelected ]} onPress={() => setPlayerToSubIn(item)}><Text style={ playerToSubIn?.id === item.id ? styles.playerSelectedText : styles.playerNormalText }>{item.playerName || item.name}</Text></TouchableOpacity> : null)) ) : (<Text style={{textAlign: 'center', marginTop: 20}}>No players on bench</Text>)}</ScrollView>
                    </View>
                </View>
                <View style={styles.modalActions}><Button title="Cancel" onPress={closeSubstitutionModal} color="gray"/><Button title="Confirm" onPress={handleConfirmSubstitution} disabled={!playerToSubIn || !playerToSubOut}/></View>
            </View></View>
        </Modal>

        {/* Modal Ayuda (Sin cambios) */}
        <Modal visible={helpModalVisible} transparent={true} onRequestClose={() => setHelpModalVisible(false)}>
             <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalText}>Button Glossary</Text>
                    <FlatList data={ABBREVIATIONS} keyExtractor={(item) => item.abbr} renderItem={({ item }) => (
                        <View style={styles.definitionRow}><Text style={styles.abbrText}>{item.abbr}:</Text><Text style={styles.meaningText}>{item.meaning}</Text></View>
                    )} style={{width: '100%'}}/>
                    <Button title="Close" onPress={() => setHelpModalVisible(false)} />
                </View>
            </View>
        </Modal>

        {/* Contenido Principal */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
             
             {/* --- MARCADOR (MODIFICADO) --- */}
            <View style={styles.mainScoreboard}>
                 <View style={styles.teamScore}>
                    <Text style={styles.teamName} numberOfLines={1} ellipsizeMode='tail'>{locationStatus === 'home' ? myTeamName : opponentName}</Text>
                    {/* Botones de Score para Equipo 1 */}
                    <View style={styles.scoreControl}>
                        <TouchableOpacity style={styles.scoreButton} onPress={() => locationStatus === 'home' ? setMyScore(s => s + 1) : setOpponentScore(s => s + 1)} disabled={isSaving}>
                            <Text style={styles.scoreButtonText}>▲</Text>
                        </TouchableOpacity>
                        <Text style={styles.scoreNumber}>{locationStatus === 'home' ? myScore : opponentScore}</Text>
                        <TouchableOpacity style={styles.scoreButton} onPress={() => locationStatus === 'home' ? setMyScore(s => (s > 0 ? s - 1 : 0)) : setOpponentScore(s => (s > 0 ? s - 1 : 0))} disabled={isSaving}>
                            <Text style={styles.scoreButtonText}>▼</Text>
                        </TouchableOpacity>
                    </View>
                 </View>
                 
                <View style={styles.gameInfo}><Text style={styles.inningText}>INN: {inning}</Text><Text style={styles.outsText}>OUTS: {outs}</Text></View>
                
                <View style={styles.teamScore}>
                    <Text style={styles.teamName} numberOfLines={1} ellipsizeMode='tail'>{locationStatus === 'away' ? myTeamName : opponentName}</Text>
                    {/* Botones de Score para Equipo 2 */}
                    <View style={styles.scoreControl}>
                        <TouchableOpacity style={styles.scoreButton} onPress={() => locationStatus === 'away' ? setMyScore(s => s + 1) : setOpponentScore(s => s + 1)} disabled={isSaving}>
                            <Text style={styles.scoreButtonText}>▲</Text>
                        </TouchableOpacity>
                        <Text style={styles.scoreNumber}>{locationStatus === 'away' ? myScore : opponentScore}</Text>
                        <TouchableOpacity style={styles.scoreButton} onPress={() => locationStatus === 'away' ? setMyScore(s => (s > 0 ? s - 1 : 0)) : setOpponentScore(s => (s > 0 ? s - 1 : 0))} disabled={isSaving}>
                            <Text style={styles.scoreButtonText}>▼</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {/* --- FIN DE MARCADOR --- */}

            {/* Acciones (Sin cambios) */}
             <View style={styles.atBatCard}>
                 <View style={styles.subHeaderContainer}>
                  <Text style={styles.subHeader} numberOfLines={1} ellipsizeMode='tail'>Batting: {currentBatter ? (currentBatter.playerName || currentBatter.name) : 'N/A'}</Text>
                  <TouchableOpacity style={styles.helpButton} onPress={() => setHelpModalVisible(true)}><Text style={styles.helpButtonText}>?</Text></TouchableOpacity>
                </View>
                <View style={styles.actionsRow}><TouchableOpacity style={styles.actionButton} onPress={handleSingle} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>1B</Text></TouchableOpacity><TouchableOpacity style={styles.actionButton} onPress={handleDouble} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>2B</Text></TouchableOpacity><TouchableOpacity style={styles.actionButton} onPress={handleTriple} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>3B</Text></TouchableOpacity><TouchableOpacity style={styles.actionButton} onPress={handleHomeRun} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>HR</Text></TouchableOpacity></View>
                <View style={styles.actionsRow}><TouchableOpacity style={[styles.actionButton, styles.walkButton]} onPress={handleWalk} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>BB</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.walkButton]} onPress={handleHBP} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>HBP</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.sacrificeButton]} onPress={handleSacrifice} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>SAC</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.utilityButton]} onPress={handleError} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>E</Text></TouchableOpacity></View>
                <View style={styles.actionsRow}><TouchableOpacity style={[styles.actionButton, styles.outButton]} onPress={handleOut} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>OUT</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.outButton]} onPress={handleStrikeout} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>K</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.outButton]} onPress={handleDoublePlay} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>DP</Text></TouchableOpacity><TouchableOpacity style={[styles.actionButton, styles.outButton]} onPress={handleTriplePlay} disabled={!currentBatter || isSaving}><Text style={styles.actionText}>TP</Text></TouchableOpacity></View>
            </View>

             {/* Acciones Utilitarias (Sin cambios) */}
            <View style={styles.utilityActionsRow}>
                 <TouchableOpacity style={[styles.utilityActionButton, isSaving && styles.disabledButton]} onPress={() => setSubstitutionModalVisible(true)} disabled={isSaving}><Text style={styles.utilityActionText}>Substitution</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.utilityActionButton, isSaving && styles.disabledButton]} onPress={handleOutOnBase} disabled={isSaving}><Text style={styles.utilityActionText}>OB</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.utilityActionButton, (!canUndo || isSaving) && styles.disabledButton]} onPress={handleUndo} disabled={!canUndo || isSaving}><Text style={styles.utilityActionText}>UNDO</Text></TouchableOpacity>
            </View>

            {/* Fin de Juego (Sin cambios) */}
            <View style={styles.endGameRow}><Button title={isSaving ? "Saving..." : "END GAME"} color="#CC0000" onPress={handleEndGame} disabled={isSaving}/></View>

             {/* Box Score (Sin cambios) */}
            <Text style={styles.boxScoreHeader}>Current Box Score</Text>
            <View style={styles.boxScoreContainer}>
                <View style={[styles.playerRow, styles.headerRow]}><Text style={[styles.playerName, styles.headerText]}>Player</Text><Text style={[styles.playerStat, styles.headerText]}>AB</Text><Text style={[styles.playerStat, styles.headerText]}>H</Text><Text style={[styles.playerStat, styles.headerText]}>BB</Text><Text style={[styles.playerStat, styles.headerText]}>K</Text><Text style={[styles.playerStat, styles.headerText]}>AVG</Text></View>
                {finalBoxScore.map((p, index) => (
                    p && p.id ? <View key={p.id + '-' + index} style={styles.playerRow}><Text style={styles.playerName}>{p.playerName || p.name}</Text><Text style={styles.playerStat}>{p.game_ab}</Text><Text style={styles.playerStat}>{p.game_hits}</Text><Text style={styles.playerStat}>{p.game_walks}</Text><Text style={styles.playerStat}>{p.game_k}</Text><Text style={styles.playerStat}>{p.avg}</Text></View> : null
                ))}
            </View>
        </ScrollView>
    </SafeAreaView>
  );
};

// --- ESTILOS (Sin cambios) ---
const styles = StyleSheet.create({
  // Estilos del Contenedor (Sin cambios)
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  container: { flex: 1, backgroundColor: '#f0f0f0' }, 
  scrollView: { backgroundColor: '#f0f0f0' },
  scrollContent: { paddingBottom: 120 },
  
  // Estilos de los Modales (Sin cambios)
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' },
  modalText: { marginBottom: 15, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  modalLabel: { alignSelf: 'flex-start', marginBottom: 5, fontSize: 16 },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, borderRadius: 8, width: '100%', marginBottom: 20, padding: 10, textAlign: 'center', fontSize: 16 },
  
  // --- Estilos del Marcador (MODIFICADOS) ---
  mainScoreboard: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginHorizontal: 15,
    marginTop: 10,
    paddingHorizontal: 15, 
    paddingVertical: 10, // Un poco menos de padding vertical
    backgroundColor: '#333', 
    borderRadius: 8,
    alignItems: 'flex-start', // Alinea al inicio
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  teamScore: { alignItems: 'center', flex: 1 },
  teamName: { color: 'white', fontSize: 16, textTransform: 'uppercase', paddingHorizontal: 5, marginBottom: 5, fontWeight: 'bold' },
  // Contenedor para los botones y el score
  scoreControl: {
    alignItems: 'center',
  },
  scoreButton: {
    paddingHorizontal: 10,
  },
  scoreButtonText: {
    color: 'white',
    fontSize: 18, // Un poco más pequeño
    fontWeight: 'bold',
  },
  scoreNumber: { 
    color: 'white', 
    fontSize: 36, 
    fontWeight: 'bold',
    marginVertical: -5 // Ajuste para pegarlo a los botones
  },
  gameInfo: { alignItems: 'center', flex: 1, paddingTop: '10%' }, // Añadido paddingTop
  inningText: { color: 'yellow', fontSize: 18, fontWeight: 'bold' },
  outsText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  // --- Fin Estilos Marcador ---

  // Estilos de Tarjetas y Botones (Sin cambios)
  atBatCard: { backgroundColor: 'white', margin: 10, padding: 15, borderRadius: 8, elevation: 2 },
  subHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  subHeader: { fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
  helpButton: { backgroundColor: '#e2e8f0', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  helpButtonText: { color: '#475569', fontWeight: 'bold', fontSize: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  actionButton: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 6, width: '23%', alignItems: 'center' },
  outButton: { backgroundColor: '#FF3B30' },
  walkButton: { backgroundColor: '#4CAF50' },
  sacrificeButton: { backgroundColor: '#1E90FF' },
  utilityButton: { backgroundColor: '#8E8E93' },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  utilityActionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10, marginTop: 10 },
  utilityActionButton: { backgroundColor: '#FF9500', padding: 12, borderRadius: 6, minWidth: '30%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#9ca3af' },
  utilityActionText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  endGameRow: { margin: 20 },
  boxScoreHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 10, marginTop: 10 },
  boxScoreContainer: { margin: 10, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 10 },
  playerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
  headerRow: { borderBottomWidth: 2, borderBottomColor: '#333', backgroundColor: '#f9f9f9' },
  headerText: { fontWeight: 'bold', fontSize: 13 },
  playerName: { fontWeight: 'bold', width: '35%' },
  playerStat: { width: '13%', textAlign: 'center', fontSize: 13 },
  definitionRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  abbrText: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6', width: '25%' },
  meaningText: { fontSize: 16, color: '#475569', flex: 1 },
  substitutionContainer: { flexDirection: 'row', width: '100%', maxHeight: 400 },
  substitutionColumn: { flex: 1, marginHorizontal: 5 },
  columnHeader: { fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  playerSelectItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  playerSelected: { backgroundColor: '#4CAF50' },
  playerSelectedText: { color: 'white', fontWeight: 'bold' },
  playerNormalText: { color: 'black' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 20 },
});

export default InProgressGameScreen;