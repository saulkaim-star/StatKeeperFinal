import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import ViewShot from "react-native-view-shot";

// --- INICIO: COMPONENTES COPIADOS DE STATSSCREEN ---

const calculateAvg = (hits, ab) => {
    const avg = ab > 0 ? (hits / ab) : 0;
    return avg.toFixed(3).toString().replace(/^0/, '');
};

// Componente FullStatRow "inteligente" (Sin cambios desde la última vez)
const FullStatRow = ({ item }) => {
    const ab = item.ab || item.game_ab || 0;
    const hits = item.hits || item.game_hits || 0;
    const doubles = item.doubles || item.game_doubles || 0;
    const triples = item.triples || item.game_triples || 0;
    const homeruns = item.homeruns || item.game_homeruns || 0;
    const walks = item.walks || item.game_walks || 0;
    const k = item.k || item.game_k || 0;
    const avg = item.avg || calculateAvg(hits, ab);

    return (
        <View style={styles.statRow}>
            <Text style={styles.statPlayerName}>{item.playerName || item.name}</Text>
            <Text style={styles.statCell}>{ab}</Text>
            <Text style={styles.statCell}>{hits}</Text>
            <Text style={styles.statCell}>{doubles}</Text>
            <Text style={styles.statCell}>{triples}</Text>
            <Text style={styles.statCell}>{homeruns}</Text>
            <Text style={styles.statCell}>{walks}</Text>
            <Text style={styles.statCell}>{k}</Text>
            <Text style={[styles.statCell, { fontWeight: 'bold' }]}>{avg}</Text>
        </View>
    );
};


// Componente para el Modal de Detalles (MODIFICADO)
const GameDetailModalContent = ({ selectedGame, viewShotRef, onShare }) => {
    const homeModalTeamName = selectedGame.homeTeamName;
    const homeModalScore = selectedGame.homeScore || 0;
    const homeModalBoxScore = selectedGame.homeBoxScore;

    const awayModalTeamName = selectedGame.awayTeamName;
    const awayModalScore = selectedGame.awayScore || 0;
    const awayModalBoxScore = selectedGame.awayBoxScore;

    const hasAnyBoxScore = (homeModalBoxScore && homeModalBoxScore.length > 0) || (awayModalBoxScore && awayModalBoxScore.length > 0);

    return (
        <>
            {/* ViewShot envuelve todo el contenido que se va a capturar */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                <View style={styles.shareableContent}>
                    <Text style={styles.modalTitle}>Game Results</Text>
                    <View style={styles.modalScoreContainer}>
                        <View style={styles.modalScoreTeam}>
                            <Text style={styles.modalScoreName}>{awayModalTeamName}</Text>
                            <Text style={styles.modalScoreNumber}>{awayModalScore}</Text>
                        </View>
                        <View style={styles.modalScoreTeam}>
                            <Text style={styles.modalScoreName}>{homeModalTeamName}</Text>
                            <Text style={styles.modalScoreNumber}>{homeModalScore}</Text>
                        </View>
                    </View>

                    <Text style={styles.boxScoreHeader}>{awayModalTeamName} Box Score</Text>
                    {(awayModalBoxScore && awayModalBoxScore.length > 0) ? (<>
                        <View style={styles.statTableHeader}> <Text style={styles.statPlayerNameHeader}>PLAYER</Text> <Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text> <Text style={styles.statCellHeader}>2B</Text><Text style={styles.statCellHeader}>3B</Text> <Text style={styles.statCellHeader}>HR</Text><Text style={styles.statCellHeader}>BB</Text> <Text style={styles.statCellHeader}>K</Text><Text style={styles.statCellHeader}>AVG</Text> </View>

                        {/* --- INICIO DE LA CORRECCIÓN 1: Se quita el ScrollView interno --- */}
                        {awayModalBoxScore.map(item => (item && (item.id || item.playerName) ? <FullStatRow key={item.id || item.playerName} item={item} /> : null))}
                        {/* --- FIN DE LA CORRECCIÓN 1 --- */}

                    </>) : (<Text style={styles.emptyText}>Box score not available.</Text>)}

                    <Text style={styles.boxScoreHeader}>{homeModalTeamName} Box Score</Text>
                    {(homeModalBoxScore && homeModalBoxScore.length > 0) ? (<>
                        <View style={styles.statTableHeader}> <Text style={styles.statPlayerNameHeader}>PLAYER</Text> <Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text> <Text style={styles.statCellHeader}>2B</Text><Text style={styles.statCellHeader}>3B</Text> <Text style={styles.statCellHeader}>HR</Text><Text style={styles.statCellHeader}>BB</Text> <Text style={styles.statCellHeader}>K</Text><Text style={styles.statCellHeader}>AVG</Text> </View>

                        {/* --- INICIO DE LA CORRECCIÓN 2: Se quita el ScrollView interno --- */}
                        {homeModalBoxScore.map(item => (item && (item.id || item.playerName) ? <FullStatRow key={item.id || item.playerName} item={item} /> : null))}
                        {/* --- FIN DE LA CORRECCIÓN 2 --- */}

                    </>) : (<Text style={styles.emptyText}>Box score not available.</Text>)}
                </View>
            </ViewShot>
            {hasAnyBoxScore && <Button title="Share Box Score" onPress={() => onShare(viewShotRef)} />}
        </>
    );
};
// --- FIN: COMPONENTES COPIADOS DE STATSSCREEN ---


// Componente GameItem (Sin cambios)
const GameItem = ({ item, onDelete, onEdit, onForfeit, onDetails }) => {
    const gameDate = item.gameDate?.toDate();
    const formattedDate = gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = gameDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const gameTitle = `${item.homeTeamName} vs ${item.awayTeamName}`;
    const statusText = item.status ? item.status.replace('_', ' ') : 'Scheduled';
    const statusStyle = styles[`status_${item.status}`] || styles.status_scheduled;

    const canTakeAction = item.status === 'scheduled';

    const isCompleted = item.status === 'completed' || item.status === 'pending_validation';
    const hasBoxScore = item.homeBoxScore || item.awayBoxScore;

    // Sub-componente
    const GameDetails = () => {
        if (isCompleted) {
            const homeScore = item.homeScore ?? '?';
            const awayScore = item.awayScore ?? '?';
            return (<Text style={[styles.itemDetails, styles.scoreDetails]}>{`Score: ${homeScore} - ${awayScore}`}</Text>);
        }
        if (item.status === 'scheduled') {
            return (<Text style={styles.itemDetails}>{`Scheduled at ${formattedTime || '?'}`}</Text>);
        }
        return <Text style={styles.itemDetails}>{statusText}</Text>;
    };

    return (
        <View style={styles.itemWrapper}>
            <View style={[styles.itemContainer, !canTakeAction && !isCompleted ? styles.itemDisabled : {}]}>
                <View style={[styles.dateBox, (canTakeAction || !isCompleted) ? styles.gameDateBox : styles.playedDateBox]}>
                    <Text style={styles.dateText}>{formattedDate || 'Date?'}</Text>
                </View>
                <View style={styles.detailsBox}>
                    <Text style={styles.itemTitle}>{gameTitle}</Text>
                    <GameDetails />

                    {item.location && (
                        <Text style={styles.locationText}>📍 {item.location}</Text>
                    )}

                    <Text style={[styles.statusText, statusStyle]}>{statusText}</Text>
                </View>
            </View>
            <View style={styles.actionButtonsContainer}>

                {isCompleted && hasBoxScore && (
                    <TouchableOpacity onPress={() => onDetails(item)} style={[styles.actionButton, styles.detailsButton]}>
                        <Text style={styles.actionButtonText}>📄</Text>
                    </TouchableOpacity>
                )}

                {(item.status === 'scheduled' || isCompleted) && (
                    <TouchableOpacity onPress={() => onEdit(item)} style={[styles.actionButton, styles.editButton]}>
                        <Text style={styles.actionButtonText}>✏️</Text>
                    </TouchableOpacity>
                )}

                {canTakeAction && (
                    <TouchableOpacity onPress={() => onForfeit(item.id, item.homeTeamName, item.awayTeamName)} style={[styles.actionButton, styles.forfeitButton]}>
                        <Text style={styles.actionButtonText}>🏳️</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => onDelete(item.id, item.homeTeamName, item.awayTeamName)} style={[styles.actionButton, styles.deleteButton]}>
                    <Text style={styles.actionButtonText}>X</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};


const CompetitionCalendarScreen = ({ route }) => {
    // --- RESTO DEL COMPONENTE (SIN CAMBIOS) ---
    const navigation = useNavigation();
    const { competitionId } = route.params || {};
    console.log("CompetitionCalendarScreen: Rendering with competitionId:", competitionId);

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [gameDetailModalVisible, setGameDetailModalVisible] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const gameDetailViewShotRef = useRef();


    // Botón '+' en el header
    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Game Schedule',
            headerRight: () => (<Button onPress={() => navigation.navigate('CreateCompetitionGame', { competitionId })} title="+" />),
        });
    }, [navigation, competitionId]);

    // Cargar juegos
    useEffect(() => {
        console.log("EFFECT: Starting to fetch games...");
        if (!competitionId) {
            console.error("EFFECT: No competitionId found in route params!");
            setError("Competition information not available."); setLoading(false); return;
        }
        setLoading(true); setError(null);
        console.log("EFFECT: Setting up Firestore listener for competition_games where competitionId =", competitionId);
        const subscriber = firestore().collection('competition_games').where('competitionId', '==', competitionId).orderBy('gameDate', 'asc')
            .onSnapshot(querySnapshot => {
                const gamesList = [];
                if (querySnapshot) {
                    console.log("EFFECT: Snapshot received! Size:", querySnapshot.size);
                    querySnapshot.forEach(doc => {
                        gamesList.push({ id: doc.id, type: 'league_game', ...doc.data() });
                    });
                    console.log("EFFECT: Processed gamesList:", gamesList.length);
                } else { console.log("EFFECT: Snapshot received but is null/undefined?"); }
                setGames(gamesList); setError(null);
                console.log("EFFECT: Setting loading to false (success)."); setLoading(false);
            }, err => {
                console.error("EFFECT: Firestore listener FAILED:", err.code, err.message);
                setError("Could not load games schedule. Check permissions, index, or network."); setGames([]);
                console.log("EFFECT: Setting loading to false (error)."); setLoading(false);
            });
        return () => { console.log("EFFECT: Cleaning up Firestore listener."); subscriber(); };
    }, [competitionId]);

    const handleShare = async (ref) => {
        try {
            const uri = await ref.current.capture();
            await Share.open({
                url: `file://${uri}`,
                type: 'image/png',
                title: 'Share Game Stats'
            });
        } catch (error) {
            if (error.message !== "User did not share") {
                console.error('Error sharing image:', error);
                Alert.alert("Error", "Could not share image.");
            }
        }
    };

    const handleShowDetails = (gameItem) => {
        setSelectedGame(gameItem);
        setGameDetailModalVisible(true);
    };

    const handleDeleteGame = (gameId, homeTeamName, awayTeamName) => {
        Alert.alert("Delete Game", `Delete ${homeTeamName} vs ${awayTeamName}?`,
            [{ text: "Cancel" }, {
                text: "Delete", style: "destructive", onPress: () => {
                    firestore().collection('competition_games').doc(gameId).delete().catch(e => Alert.alert("Error", "Could not delete game."));
                },
            },]
        );
    };

    const handleEditGame = (game) => {
        if (game.status === 'scheduled') {
            navigation.navigate('EditGame', { gameId: game.id, competitionId: competitionId });
        } else if (game.status === 'completed') {
            console.log("Navigating to ResolveGame to correct score for game:", game.id);
            navigation.navigate('ResolveGame', { gameId: game.id, competitionId: competitionId });
        }
    };

    const handleMarkForfeit = (gameId, homeTeamName, awayTeamName) => {
        Alert.alert("Mark Forfeit", `Which team forfeited the game between ${homeTeamName} and ${awayTeamName}?`,
            [{ text: "Cancel", style: "cancel" }, { text: `${awayTeamName} (Away) Forfeited`, onPress: () => updateGameForfeit(gameId, true) }, { text: `${homeTeamName} (Home) Forfeited`, onPress: () => updateGameForfeit(gameId, false), style: "destructive" },]
        );
    };
    const updateGameForfeit = async (gameId, isHomeWin) => {
        // Lógica para actualizar el forfeit
        console.log(`Marking game ${gameId} as forfeit. Home win: ${isHomeWin}`);

        const gameRef = firestore().collection('competition_games').doc(gameId);
        try {
            await gameRef.update({
                status: 'completed',
                homeScore: isHomeWin ? 7 : 0,
                awayScore: isHomeWin ? 0 : 7,
                resolution: isHomeWin ? 'forfeit_away' : 'forfeit_home', // home wins = away forfeits
                // Marcar como validado por ambos ya que es una acción del organizador
                homeManagerValidated: true,
                awayManagerValidated: true,
            });
            Alert.alert("Success", "Game has been marked as forfeit.");
        } catch (error) {
            console.error("Error marking forfeit:", error);
            Alert.alert("Error", "Could not update game to forfeit.");
        }
    };

    console.log("RENDER: Current state:", { loading, error: !!error, gamesCount: games.length });
    if (loading) { console.log("RENDER: Showing loading indicator."); return <View style={styles.center}><ActivityIndicator size="large" /></View>; }
    if (error) { console.log("RENDER: Showing error message:", error); return (<View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>); }

    console.log("RENDER: Rendering FlatList.");
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={games}
                renderItem={({ item }) => (
                    <GameItem
                        item={item}
                        onDelete={handleDeleteGame}
                        onEdit={handleEditGame}
                        onForfeit={handleMarkForfeit}
                        onDetails={handleShowDetails}
                    />
                )}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No games scheduled yet.</Text>}
                contentContainerStyle={{ padding: 10 }}
            />

            {/* --- INICIO DE LA CORRECCIÓN 3: Añadir ScrollView externo --- */}
            <Modal visible={gameDetailModalVisible} onRequestClose={() => setGameDetailModalVisible(false)} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <ScrollView>
                        {selectedGame && (
                            <GameDetailModalContent
                                selectedGame={selectedGame}
                                viewShotRef={gameDetailViewShotRef}
                                onShare={handleShare}
                            />
                        )}
                    </ScrollView>
                    <Button title="Close" onPress={() => setGameDetailModalVisible(false)} color="gray" />
                </SafeAreaView>
            </Modal>
            {/* --- FIN DE LA CORRECCIÓN 3 --- */}
        </SafeAreaView>
    );
};

// --- Estilos (Sin cambios) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
    emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16 },
    itemWrapper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 8, },
    itemContainer: { flex: 1, flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, elevation: 2, overflow: 'hidden', },
    itemDisabled: { opacity: 0.7, backgroundColor: '#e5e7eb', },
    dateBox: { padding: 15, justifyContent: 'center', alignItems: 'center', minWidth: 70 },
    gameDateBox: { backgroundColor: '#3b82f6' },
    playedDateBox: { backgroundColor: '#6b7280' },
    dateText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    detailsBox: { flex: 1, padding: 15 },
    itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    itemDetails: { fontSize: 14, color: 'gray', marginTop: 4, textTransform: 'capitalize' },
    scoreDetails: { color: '#1f2937', fontWeight: '500', fontSize: 15, },
    statusText: { fontSize: 10, fontWeight: 'bold', marginTop: 5, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', alignSelf: 'flex-start', textTransform: 'capitalize' },
    status_scheduled: { backgroundColor: '#e0e7ff', color: '#4f46e5' },
    status_pending_validation: { backgroundColor: '#fef3c7', color: '#d97706' },
    status_completed: { backgroundColor: '#e5e7eb', color: '#4b5563' },
    actionButtonsContainer: { flexDirection: 'column', marginLeft: 10, justifyContent: 'center' },
    actionButton: { borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 2, },
    detailsButton: { backgroundColor: '#bfdbfe', },
    editButton: { backgroundColor: '#dbeafe', },
    forfeitButton: { backgroundColor: '#ffedd5', },
    deleteButton: { backgroundColor: '#fee2e2', },
    actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#374151', },
    deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },

    locationText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        marginTop: 4,
    },

    // --- ESTILOS DEL MODAL (COPIADOS DE STATSSCREEN) ---
    modalContainer: { flex: 1, backgroundColor: '#f5f7fa' },
    shareableContent: { backgroundColor: 'white', paddingBottom: 10 }, // Añadido padding para que no se pegue al fondo
    modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, paddingTop: 20, backgroundColor: 'white' },
    modalScoreContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1f2937', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 8, marginHorizontal: 16, marginBottom: 20, elevation: 4, },
    modalScoreTeam: { alignItems: 'center', flex: 1, },
    modalScoreName: { fontSize: 18, fontWeight: 'bold', color: '#f3f4f6', textAlign: 'center', },
    modalScoreNumber: { fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 5, },
    boxScoreHeader: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 16, marginTop: 15, marginBottom: 10 },
    statTableHeader: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 15, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9' },
    statPlayerNameHeader: { flex: 2, fontWeight: 'bold' },
    statCellHeader: { flex: 1, fontWeight: 'bold', textAlign: 'center' },
    statRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', alignItems: 'center' },
    statPlayerName: { flex: 2 },
    statCell: { flex: 1, textAlign: 'center' },
});

export default CompetitionCalendarScreen;