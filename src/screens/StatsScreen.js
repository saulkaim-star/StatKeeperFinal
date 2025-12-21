import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import ViewShot from "react-native-view-shot";
import { handleDeleteAccount } from '../utils/authUtils';

// --- COMPONENTES AUXILIARES (Sin cambios) ---
const calculateAvg = (hits, ab) => { const avg = ab > 0 ? (hits / ab) : 0; return avg.toFixed(3).toString().replace(/^0/, ''); };
const LeaderItem = ({ item }) => (<View style={styles.leaderRow}><Text style={styles.leaderStat}>{item.stat}</Text><Text style={styles.leaderName}>{item.name}</Text><Text style={styles.leaderValue}>{item.value}</Text></View>);
const SimpleStatRow = ({ item }) => (<View style={styles.statRow}><Text style={styles.statPlayerName}>{item.playerName || item.name}</Text><Text style={styles.statCell}>{item.ab || 0}</Text><Text style={styles.statCell}>{item.hits || 0}</Text><Text style={[styles.statCell, { fontWeight: 'bold' }]}>{item.avg}</Text></View>);
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

// --- COMPONENTE GameItem (Sin cambios) ---
const GameItem = ({ item, onDetails, onDelete, onValidate, isPlayerView, teamId, userId }) => {
    const isLeague = item.type === 'league_game';
    const gameDate = isLeague ? item.gameDate?.toDate() : item.date?.toDate();
    const opponent = isLeague ? (item.homeTeamId === teamId ? item.awayTeamName : item.homeTeamName) : item.opponentName;
    const myFinalScore = Number(isLeague ? (item.homeTeamId === teamId ? item.homeScore : item.awayScore) : item.myScore) || 0;
    const oppFinalScore = Number(isLeague ? (item.homeTeamId === teamId ? item.awayScore : item.homeScore) : item.opponentScore) || 0;
    const statusText = item.status || (isLeague ? 'Unknown' : 'completed');
    let statusStyle = styles.status_completed;
    let needsValidation = false; let buttonText = "Details"; let buttonAction = () => onDetails(item); let buttonStyle = styles.detailsButton;
    if (isLeague && !isPlayerView) {
        if (statusText === 'scheduled') statusStyle = styles.status_scheduled;
        else if (statusText === 'live') statusStyle = styles.status_live;
        else if (statusText === 'pending_validation') {
            statusStyle = styles.status_pending_validation;
            const isHomeManager = item.homeTeamId === teamId;
            const myValidationFlag = isHomeManager ? item.homeManagerValidated : item.awayManagerValidated;
            if (!myValidationFlag) {
                needsValidation = true;
                buttonText = "Review & Validate";
                buttonAction = () => onValidate(item);
                buttonStyle = styles.validateButton;
            }
        }
    } else if (isLeague) {
        if (statusText === 'scheduled') statusStyle = styles.status_scheduled;
        else if (statusText === 'live') statusStyle = styles.status_live;
        else if (statusText === 'pending_validation') statusStyle = styles.status_pending_validation;
    }
    const displayScore = (statusText === 'completed' || statusText === 'pending_validation');
    const showActionButton = needsValidation || (item.boxScore || item.homeBoxScore || item.awayBoxScore);
    const isForfeit = item.resolution && item.resolution.startsWith('forfeit_');

    return (
        <View style={[styles.gameItem, isLeague && styles.leagueGameItemBorder]}>
            <View style={styles.gameItemInfo}>
                <Text style={styles.gameOpponent}>vs {opponent || 'Unknown'}</Text>
                {gameDate && <Text style={styles.gameDateText}>{gameDate.toLocaleDateString()}</Text>}
                {isLeague && (<Text style={[styles.statusText, statusStyle]}>{statusText.replace('_', ' ')}</Text>)}
            </View>
            <Text style={styles.gameScore}>
                {displayScore ? `${myFinalScore} - ${oppFinalScore}` : '-'}
            </Text>
            <View style={styles.gameActions}>
                {isForfeit ? (
                    <TouchableOpacity style={styles.forfeitButton} onPress={() => onDetails(item)}>
                        <Text style={styles.buttonText}>FORFEIT</Text>
                    </TouchableOpacity>
                ) : (
                    (showActionButton && !needsValidation) && <TouchableOpacity onPress={buttonAction} style={buttonStyle}><Text style={styles.buttonText}>{buttonText}</Text></TouchableOpacity>
                )}
                {!isPlayerView && needsValidation && (
                    <TouchableOpacity onPress={buttonAction} style={buttonStyle}><Text style={styles.buttonText}>{buttonText}</Text></TouchableOpacity>
                )}
                {!isLeague && !isPlayerView && (<TouchableOpacity onPress={() => onDelete(item.id, opponent)} style={styles.deleteButton}><Text style={styles.buttonText}>X</Text></TouchableOpacity>)}
            </View>
        </View>
    );
};

// --- COMPONENTE: TARJETA DE PRÓXIMO JUEGO (Sin cambios) ---
const NextGameCard = ({ nextGame, teamId, navigation }) => {
    if (!nextGame || !navigation || !teamId) return null;
    const gameDate = nextGame.gameDate?.toDate();
    const formattedDate = gameDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const formattedTime = gameDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const opponentName = nextGame.opponentName;
    const locationText = nextGame.isHome ? '(Home)' : '(Away)';
    const locationStatus = nextGame.isHome ? 'home' : 'away';
    const handlePress = () => {
        navigation.navigate('SelectLineup', {
            teamId: teamId, opponentName: opponentName, locationStatus: locationStatus,
            isLeagueGame: true, leagueGameId: nextGame.id, competitionId: nextGame.competitionId,
            gameLocation: nextGame.location
        });
    };
    return (
        <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
            <View style={[styles.card, styles.nextGameCard]}>
                <Text style={styles.nextGameTitle}>Next Game</Text>
                <Text style={styles.nextGameOpponent}>vs {opponentName} <Text style={styles.locationText}>{locationText}</Text></Text>
                <Text style={styles.nextGameDateTime}>{formattedDate}</Text>
                <Text style={styles.nextGameDateTime}>{formattedTime}</Text>
                {nextGame.location && (
                    <Text style={styles.nextGameLocation}>📍 {nextGame.location}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// --- Funciones de Cálculo (Sin cambios) ---
const getLeaders = (s, p, a, i = !1) => { if (0 === p.length) return { stat: s, name: "N/A", value: i ? ".000" : 0 }; const t = [...p].sort((s, p) => (a(p) || 0) - (a(s) || 0)), e = a(t[0]) || 0; if (0 === e && !i) return { stat: s, name: "N/A", value: 0 }; const l = t.filter(s => (a(s) || 0) === e), r = l.map(s => s.playerName || s.name).join(", "), o = i ? calculateAvg(l[0].hits, l[0].ab) : e; return { stat: s, name: r, value: o } };
const aggregateLeagueStats = (leagueGames, teamId) => {
    const statsMap = {};
    const completedGames = leagueGames.filter(g => g.status === 'completed');
    completedGames.forEach(game => {
        const isHome = game.homeTeamId === teamId;
        const boxScore = isHome ? game.homeBoxScore : game.awayBoxScore;
        if (boxScore && Array.isArray(boxScore)) {
            boxScore.forEach(playerStat => {
                if (playerStat && (playerStat.id || playerStat.playerName)) {
                    const id = playerStat.id || playerStat.playerName;
                    if (!statsMap[id]) {
                        statsMap[id] = { id: id, playerName: playerStat.playerName || playerStat.name || 'Unknown', ab: 0, hits: 0, doubles: 0, triples: 0, homeruns: 0, walks: 0, k: 0 };
                    }
                    statsMap[id].ab += (playerStat.game_ab || 0);
                    statsMap[id].hits += (playerStat.game_hits || 0);
                    statsMap[id].doubles += (playerStat.game_doubles || 0);
                    statsMap[id].triples += (playerStat.game_triples || 0);
                    statsMap[id].homeruns += (playerStat.game_homeruns || 0);
                    statsMap[id].walks += (playerStat.game_walks || 0);
                    statsMap[id].k += (playerStat.game_k || 0);
                }
            });
        }
    });
    return Object.values(statsMap).map(player => ({ ...player, avg: calculateAvg(player.hits, player.ab) }));
};

const StatsScreen = ({ route }) => {
    // --- Hooks (Sin cambios) ---
    const navigation = useNavigation();
    const { teamId, teamName: initialTeamName, isPlayerView } = route.params || {};
    const currentUser = auth().currentUser;
    const handleLogout = () => { auth().signOut(); };
    const handleJoinCompetition = () => { navigation.navigate('JoinCompetition'); };
    useLayoutEffect(() => { if (!isPlayerView) { navigation.setOptions({ headerRight: () => (<View style={styles.headerButtonContainer}> <TouchableOpacity onPress={handleJoinCompetition} style={styles.joinButton}><Text style={styles.joinButtonText}>🏆 Join</Text></TouchableOpacity> <Button onPress={handleLogout} title="Log Out" color="#ef4444" /> </View>), }); } else { navigation.setOptions({ headerRight: () => (<Button onPress={handleLogout} title="Log Out" color="#ef4444" />) }); } }, [navigation, isPlayerView]);
    const statsViewShotRef = useRef(); const gameDetailViewShotRef = useRef();

    // --- Estados (Sin cambios) ---
    const [teamName, setTeamName] = useState(initialTeamName || '');
    const [teamLogo, setTeamLogo] = useState(null);
    const [privateGames, setPrivateGames] = useState([]);
    const [leagueGames, setLeagueGames] = useState([]);
    const [playersStats, setPlayersStats] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(true);
    const [statsModalVisible, setStatsModalVisible] = useState(false);
    const [gameDetailModalVisible, setGameDetailModalVisible] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [competitionInfo, setCompetitionInfo] = useState({ id: null, name: null });
    const [loadingCompetition, setLoadingCompetition] = useState(true);
    const [nextGame, setNextGame] = useState(null);
    const [loadingNextGame, setLoadingNextGame] = useState(false);
    const [leagueStandings, setLeagueStandings] = useState([]);
    const [loadingLeagueStandings, setLoadingLeagueStandings] = useState(true);

    // --- useEffect (Listener principal - CORREGIDO) ---
    useEffect(() => {
        if (!teamId) {
            setLoadingRoster(false);
            setLoadingHistory(false);
            setLoadingCompetition(false);
            return;
        }

        let teamNameSubscriber = () => { };
        // ALWAYS listen to the team doc to get the latest photoURL and name updates
        teamNameSubscriber = firestore().collection('teams').doc(teamId).onSnapshot(doc => {
            if (doc.exists) {
                setTeamName(doc.data().teamName || '');
                setTeamLogo(doc.data().photoURL || null);
            }
        }, error => { console.error("Error fetching team details:", error); });

        setLoadingRoster(true);
        const playersSubscriber = firestore().collection('teams').doc(teamId).collection('roster').onSnapshot(querySnapshot => { setPlayersStats(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))); setLoadingRoster(false); }, error => { console.error("Error fetching roster:", error); setLoadingRoster(false); });

        const privateGamesSubscriber = firestore().collection('teams').doc(teamId).collection('games').where('status', '==', 'completed').orderBy('date', 'desc')
            .onSnapshot(querySnapshot => {
                if (!isPlayerView) {
                    const pGames = [];
                    if (querySnapshot) { querySnapshot.forEach(doc => { pGames.push({ type: 'private', id: doc.id, sortDate: doc.data().date?.toDate(), ...doc.data() }); }); }
                    setPrivateGames(pGames);
                }
            }, error => { console.error("Error fetching private games:", error); });

        setLoadingCompetition(true);
        let competitionDetailsSubscriber = () => { };
        const competitionTeamSubscriber = firestore().collection('competition_teams').where('teamId', '==', teamId).limit(1)
            .onSnapshot(querySnapshot => {

                competitionDetailsSubscriber();

                if (!querySnapshot.empty) {
                    const compLinkDoc = querySnapshot.docs[0];
                    const compId = compLinkDoc.data().competitionId;

                    if (!compId) {
                        setCompetitionInfo({ id: null, name: null });
                        setLoadingCompetition(false);
                        return;
                    }

                    competitionDetailsSubscriber = firestore().collection('competitions').doc(compId)
                        .onSnapshot(compDoc => {
                            if (compDoc.exists) {
                                const compDocData = compDoc.data();

                                if (compDocData.status === 'completed' || compDocData.status === 'archived') {
                                    setCompetitionInfo({ id: null, name: null });
                                    compLinkDoc.ref.delete()
                                        .then(() => console.log("StatsScreen: Cleaned up completed/archived league link for teamId:", teamId))
                                        .catch(err => console.error("StatsScreen: Error cleaning up league link:", err));

                                } else {
                                    setCompetitionInfo({ id: compId, name: compDocData.name, status: compDocData.status });
                                }
                                setLoadingCompetition(false);

                            } else {
                                setCompetitionInfo({ id: null, name: null });
                                setLoadingCompetition(false);
                            }
                        }, err => {
                            console.error("Error listening to comp details:", err);
                            setLoadingCompetition(false);
                        });

                } else {
                    setCompetitionInfo({ id: null, name: null });
                    setLoadingCompetition(false);
                }
            }, error => {
                console.error("Error searching comp_teams:", error);
                setLoadingCompetition(false);
            });

        return () => {
            teamNameSubscriber();
            playersSubscriber();
            privateGamesSubscriber();
            competitionTeamSubscriber();
            competitionDetailsSubscriber();
        };
    }, [teamId, initialTeamName, isPlayerView]);
    // --- FIN useEffect Principal ---


    // --- useEffect para JUEGOS DE LIGA (HISTORIAL) ---
    useEffect(() => {
        if (!competitionInfo.id || !teamId) {
            setLeagueGames([]);
            setLoadingHistory(false);
            return () => { };
        }

        setLoadingHistory(true);
        const relevantStatuses = ['completed', 'pending_validation'];

        const homeGamesQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionInfo.id)
            .where('homeTeamId', '==', teamId)
            .where('status', 'in', relevantStatuses)
            .orderBy('gameDate', 'desc');

        const awayGamesQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionInfo.id)
            .where('awayTeamId', '==', teamId)
            .where('status', 'in', relevantStatuses)
            .orderBy('gameDate', 'desc');

        let leagueGamesMap = {};
        const handleLeagueSnapshot = (querySnapshot, type) => {
            let changed = false;
            if (querySnapshot) {
                querySnapshot.forEach(doc => { const gameData = { type: 'league_game', id: doc.id, sortDate: doc.data().gameDate?.toDate(), ...doc.data() }; if (!leagueGamesMap[doc.id] || leagueGamesMap[doc.id].status !== gameData.status) { leagueGamesMap[doc.id] = gameData; changed = true; } });
                const currentIdsInSnapshot = new Set(querySnapshot.docs.map(d => d.id));
                Object.keys(leagueGamesMap).forEach(gameId => { const game = leagueGamesMap[gameId]; const isRelevantType = (type === 'HOME' && game.homeTeamId === teamId) || (type === 'AWAY' && game.awayTeamId === teamId); if (isRelevantType && !currentIdsInSnapshot.has(gameId) && relevantStatuses.includes(game.status)) { delete leagueGamesMap[gameId]; changed = true; } });
            }
            if (changed) { setLeagueGames(Object.values(leagueGamesMap)); }
            setLoadingHistory(false);
        };
        const handleLeagueError = (error, type) => { console.error(`Error fetching ${type} league games:`, error); setLoadingHistory(false); };

        const homeSubscriber = homeGamesQuery.onSnapshot(snap => handleLeagueSnapshot(snap, 'HOME'), err => handleLeagueError(err, 'HOME'));
        const awaySubscriber = awayGamesQuery.onSnapshot(snap => handleLeagueSnapshot(snap, 'AWAY'), err => handleLeagueError(err, 'AWAY'));

        return () => {
            homeSubscriber();
            awaySubscriber();
        };
    }, [competitionInfo.id, teamId]);
    // --- FIN NUEVO useEffect ---


    // --- useEffect para PRÓXIMO JUEGO ---
    useEffect(() => {
        if (!competitionInfo.id || !teamId) {
            setNextGame(null);
            setLoadingNextGame(false);
            return () => { };
        }

        setLoadingNextGame(true);
        const now = firestore.Timestamp.now();
        let nextHomeGame = null; let nextAwayGame = null;
        let homeListener = () => { }; let awayListener = () => { };

        const homeQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionInfo.id)
            .where('homeTeamId', '==', teamId)
            .where('status', '==', 'scheduled')
            .where('gameDate', '>=', now)
            .orderBy('gameDate', 'asc').limit(1);

        const awayQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionInfo.id)
            .where('awayTeamId', '==', teamId)
            .where('status', '==', 'scheduled')
            .where('gameDate', '>=', now)
            .orderBy('gameDate', 'asc').limit(1);

        const findEarliestGame = () => {
            if (nextHomeGame && nextAwayGame) { setNextGame(nextHomeGame.gameDate.toDate() < nextAwayGame.gameDate.toDate() ? nextHomeGame : nextAwayGame); }
            else { setNextGame(nextHomeGame || nextAwayGame); }
            setLoadingNextGame(false);
        };
        homeListener = homeQuery.onSnapshot(snapshot => {
            if (!snapshot.empty) { const game = snapshot.docs[0].data(); nextHomeGame = { ...game, id: snapshot.docs[0].id, opponentName: game.awayTeamName, isHome: true }; }
            else { nextHomeGame = null; }
            findEarliestGame();
        }, error => { console.error("Error fetching next home game:", error); setLoadingNextGame(false); });
        awayListener = awayQuery.onSnapshot(snapshot => {
            if (!snapshot.empty) { const game = snapshot.docs[0].data(); nextAwayGame = { ...game, id: snapshot.docs[0].id, opponentName: game.homeTeamName, isHome: false }; }
            else { nextAwayGame = null; }
            findEarliestGame();
        }, error => { console.error("Error fetching next away game:", error); setLoadingNextGame(false); });

        return () => {
            homeListener();
            awayListener();
        };

    }, [competitionInfo.id, teamId]);
    // --- FIN useEffect PRÓXIMO JUEGO ---

    // --- useEffect PARA EL RANKING DE LIGA ---
    useEffect(() => {
        if (!competitionInfo.id) {
            setLeagueStandings([]);
            setLoadingLeagueStandings(false);
            return;
        }

        setLoadingLeagueStandings(true);
        const teamsPromise = firestore()
            .collection('competition_teams')
            .where('competitionId', '==', competitionInfo.id)
            .get();
        const gamesPromise = firestore()
            .collection('competition_games')
            .where('competitionId', '==', competitionInfo.id)
            .where('status', '==', 'completed')
            .get();

        Promise.all([teamsPromise, gamesPromise])
            .then(([teamsSnapshot, gamesSnapshot]) => {
                const standingsMap = {};
                teamsSnapshot.docs.forEach(doc => {
                    const teamData = doc.data();
                    standingsMap[teamData.teamId] = {
                        id: teamData.teamId,
                        name: teamData.teamName,
                        W: 0, L: 0, T: 0, GP: 0
                    };
                });
                gamesSnapshot.docs.forEach(doc => {
                    const g = doc.data();
                    const hId = g.homeTeamId, aId = g.awayTeamId, hS = g.homeScore, aS = g.awayScore;
                    if (standingsMap[hId] && standingsMap[aId]) {
                        standingsMap[hId].GP++;
                        standingsMap[aId].GP++;
                        if (hS > aS) {
                            standingsMap[hId].W++;
                            standingsMap[aId].L++;
                        } else if (aS > hS) {
                            standingsMap[aId].W++;
                            standingsMap[hId].L++;
                        } else {
                            standingsMap[hId].T++;
                            standingsMap[aId].T++;
                        }
                    }
                });
                const result = Object.values(standingsMap).sort((a, b) => b.W - a.W || a.L - b.L || b.T - a.T);
                setLeagueStandings(result);
                setLoadingLeagueStandings(false);
            })
            .catch(err => {
                console.error("Error calculating full league standings:", err);
                setLoadingLeagueStandings(false);
            });
    }, [competitionInfo.id]);
    // --- FIN NUEVO useEffect ---


    // --- useMemo (Lógica de filtrado de temporada) ---
    const processedData = useMemo(() => {
        const defaults = { wins: 0, losses: 0, ties: 0, leaders: [], table: [], displayedGames: [] };

        if (competitionInfo.id) {
            const completedLeagueGames = leagueGames.filter(g => g.status === 'completed');
            let wins = 0, losses = 0, ties = 0;
            completedLeagueGames.forEach(g => { const myScore = (g.homeTeamId === teamId ? g.homeScore : g.awayScore); const oppScore = (g.homeTeamId === teamId ? g.awayScore : g.homeScore); if (myScore > oppScore) wins++; else if (myScore < oppScore) losses++; else if (myScore === oppScore) ties++; });
            const aggregatedStats = aggregateLeagueStats(leagueGames, teamId);
            const table = aggregatedStats.filter(p => (p.ab || 0) > 0).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
            const qualifiedPlayers = table.filter(s => (s.ab || 0) > 0);
            const leaders = [getLeaders("AVG", qualifiedPlayers, s => (s.hits || 0) / (s.ab || 1), !0), getLeaders("H", table, s => s.hits || 0), getLeaders("HR", table, s => s.homeruns || 0), getLeaders("BB", table, s => s.walks || 0), getLeaders("K", table, s => s.k || 0)];
            const displayedGames = [...leagueGames].sort((a, b) => (b.sortDate || 0) - (a.sortDate || 0));
            return { wins, losses, ties, leaders, table, displayedGames };

        } else if (!isPlayerView) {
            const wins = privateGames.filter(g => g.myScore > g.opponentScore).length;
            const losses = privateGames.filter(g => g.myScore < g.opponentScore).length;
            const ties = privateGames.filter(g => g.myScore === g.opponentScore).length;
            const table = playersStats.filter(p => (p.ab || 0) > 0).map(player => ({ ...player, avg: calculateAvg(player.hits, player.ab) })).sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
            const qualifiedPlayers = playersStats.filter(s => (s.ab || 0) > 0);
            const leaders = [getLeaders("AVG", qualifiedPlayers, s => (s.hits || 0) / (s.ab || 1), !0), getLeaders("H", playersStats, s => s.hits || 0), getLeaders("HR", playersStats, s => s.homeruns || 0), getLeaders("BB", playersStats, s => s.walks || 0), getLeaders("K", playersStats, s => s.k || 0)];
            const displayedGames = [...privateGames];
            return { wins, losses, ties, leaders, table, displayedGames };
        }

        return defaults;
    }, [playersStats, privateGames, leagueGames, competitionInfo, teamId, isPlayerView]);
    // --- FIN useMemo ---


    // --- useMemo DE RANKING (CORREGIDO) ---
    const teamRank = useMemo(() => {
        if (!teamId || leagueStandings.length === 0) return null;
        const myTeamStanding = leagueStandings.find(team => team.id === teamId);
        if (!myTeamStanding) {
            return null;
        }
        if (myTeamStanding.GP === 0) {
            return "N/A";
        }
        const rankIndex = leagueStandings.findIndex(team => team.id === teamId);
        if (rankIndex === -1) return null;
        const rank = rankIndex + 1;
        if (rank === 1) return "1st";
        if (rank === 2) return "2nd";
        if (rank === 3) return "3rd";
        return `${rank}th`;
    }, [leagueStandings, teamId]);
    // --- FIN useMemo DE RANKING ---


    // --- Funciones (handleShare, etc.) (RESTAURADA) ---
    const handleShare = async (ref) => {
        try {
            const uri = await ref.current.capture();
            const options = {
                title: 'Share Stats',
                message: `Check out these stats from ${teamName} in StatKeeper!`,
                url: uri,
                type: 'image/png',
            };
            await Share.open(options);
        } catch (error) {
            console.error("Error sharing stats:", error);
            // No alertar si el usuario canceló
            if (error.message !== 'User did not share') {
                Alert.alert("Error", "Could not share stats.");
            }
        }
    };

    const handleDeleteGame = (gameId, opponentName) => {
        Alert.alert(
            "Delete Game",
            `Are you sure you want to delete the game vs ${opponentName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await firestore().collection('teams').doc(teamId).collection('games').doc(gameId).delete();
                            // El listener actualizará la lista
                        } catch (error) {
                            console.error("Error deleting game:", error);
                            Alert.alert("Error", "Could not delete game.");
                        }
                    }
                }
            ]
        );
    };

    const handleShowDetails = (gameItem) => { setSelectedGame(gameItem); setGameDetailModalVisible(true); };

    const handleValidateGame = (gameItem) => {
        const isHomeManager = gameItem.homeTeamId === teamId;
        const myValidationField = isHomeManager ? 'homeManagerValidated' : 'awayManagerValidated';

        Alert.alert(
            "Validate Game Result",
            `Do you confirm the result: ${gameItem.awayTeamName} ${gameItem.awayScore} - ${gameItem.homeScore} ${gameItem.homeTeamName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Validate",
                    onPress: async () => {
                        try {
                            await firestore().collection('competition_games').doc(gameItem.id).update({
                                [myValidationField]: true
                            });
                            Alert.alert("Success", "Game result validated.");
                        } catch (error) {
                            console.error("Error validating game:", error);
                            Alert.alert("Error", "Could not validate game.");
                        }
                    }
                }
            ]
        );
    };

    // --- Estado de Carga (ACTUALIZADO) ---
    if (loadingRoster || loadingHistory || loadingCompetition || loadingNextGame || loadingLeagueStandings) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" /></View>;
    }

    // --- BUTTON HANDLERS FOR WEB DASHBOARDS ---
    const handleUpdateLogo = () => {
        if (!currentUser) { Alert.alert('Error', 'You must be logged in to update the logo.'); return; }
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, async (response) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert('Error', response.errorMessage); return; }
            if (response.assets && response.assets.length > 0) {
                const uploadUri = response.assets[0].uri;
                let filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
                const extension = filename.split('.').pop();
                // Use a path that is likely allowed by rules: media_posts/{userId}/...
                const storagePath = `media_posts/${currentUser.uid}/team_logos/${teamId}_${Date.now()}.${extension}`;
                try {
                    const storageRef = storage().ref(storagePath);
                    await storageRef.putFile(uploadUri);
                    const url = await storageRef.getDownloadURL();
                    await firestore().collection('teams').doc(teamId).update({ photoURL: url });
                    setTeamLogo(url);
                } catch (e) {
                    console.error("Upload error details:", e);
                    Alert.alert('Error', 'Could not upload image. Permission denied?');
                }
            }
        });
    };

    const vercelURL = 'https://team-web-steel.vercel.app';

    const handleOpenLeaguePage = async () => {
        if (!competitionInfo.id) return;
        const url = `${vercelURL}/l/${competitionInfo.id}`;
        try {
            await Linking.openURL(url);
        } catch (err) {
            Alert.alert("Error", "Failed to open league page.");
        }
    };

    const handleOpenTeamPage = async () => {
        if (!teamId) return;
        const url = `${vercelURL}/t/${teamId}`;
        try {
            await Linking.openURL(url);
        } catch (err) {
            Alert.alert("Error", "Failed to open team page.");
        }
    };

    // --- Componente de renderizado (¡MODIFICADO!) ---
    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <>
                        <View style={styles.logoContainer}>
                            {teamLogo ? (
                                <Image source={{ uri: teamLogo }} style={styles.teamLogo} />
                            ) : (
                                <View style={styles.teamLogoPlaceholder}>
                                    <Text style={styles.teamLogoPlaceholderText}>{teamName ? teamName.charAt(0).toUpperCase() : 'T'}</Text>
                                </View>
                            )}
                            {!isPlayerView && (
                                <TouchableOpacity style={styles.editLogoButton} onPress={handleUpdateLogo}>
                                    <Text style={styles.editLogoText}>✏️</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.title}>{teamName} Stats</Text>

                        <View style={styles.card}>
                            <Text style={styles.subHeaderCompact}>Team Record (W-L-T)</Text>
                            <View style={styles.recordDisplay}>
                                <Text style={styles.recordCompactText}>
                                    <Text style={{ color: '#10b981' }}>{processedData.wins}</Text>
                                    <Text style={styles.recordCompactText}>-</Text>
                                    <Text style={{ color: '#ef4444' }}>{processedData.losses}</Text>
                                    <Text style={styles.recordCompactText}>-</Text>
                                    <Text style={{ color: '#ffc107' }}>{processedData.ties}</Text>
                                </Text>
                            </View>
                            {competitionInfo.id && (<Text style={styles.competitionText}>Competition: {competitionInfo.name}</Text>)}

                            {competitionInfo.id && teamRank && (
                                <Text style={styles.rankText}>League Rank: {teamRank}</Text>
                            )}

                            {/* --- BOTONES DE ENLACE WEB --- */}
                            <View style={{ marginTop: 15 }}>
                                {/* Botón de Equipo (SIEMPRE VISIBLE) */}
                                <TouchableOpacity
                                    style={[styles.webButton, { backgroundColor: '#3b82f6', marginBottom: 10 }]}
                                    onPress={handleOpenTeamPage}
                                >
                                    <Text style={styles.webButtonText}>
                                        ⚾ View Team Dashboard
                                    </Text>
                                </TouchableOpacity>

                                {/* Botón de Liga (CONDICIONAL) */}
                                {competitionInfo.id && (
                                    <TouchableOpacity
                                        style={[styles.webButton, { backgroundColor: '#10B981' }]} // Verde
                                        onPress={handleOpenLeaguePage}
                                    >
                                        <Text style={styles.webButtonText}>
                                            🏆 View League Dashboard
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.card}><Text style={styles.header}>Team Leaders</Text>{processedData.leaders.map(item => <LeaderItem key={item.stat} item={item} />)}</View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}><Text style={styles.header}>Player Stats</Text><TouchableOpacity onPress={() => setStatsModalVisible(true)}><Text style={styles.detailsLink}>View All & Share</Text></TouchableOpacity></View>
                            <View style={styles.statTableHeader}><Text style={styles.statPlayerNameHeader}>PLAYER</Text><Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text><Text style={styles.statCellHeader}>AVG</Text></View>
                            {processedData.table.slice(0, 5).map(item => <SimpleStatRow key={item.id} item={item} />)}
                        </View>

                        {competitionInfo.id && nextGame &&
                            <NextGameCard
                                nextGame={nextGame}
                                teamId={teamId}
                                navigation={navigation}
                            />
                        }

                        <Text style={styles.header}>Game History</Text>
                    </>
                }
                data={processedData.displayedGames}
                keyExtractor={item => item.type + '_' + item.id}
                renderItem={({ item }) => (
                    <GameItem item={item} isPlayerView={isPlayerView} teamId={teamId} userId={currentUser?.uid} onDetails={handleShowDetails} onDelete={handleDeleteGame} onValidate={handleValidateGame} />
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>{
                    competitionInfo.id ? "No league games found." : "No private games found."
                }</Text>}
                contentContainerStyle={{ paddingBottom: 20 }}

                // --- FOOTER CON BOTÓN DE ELIMINAR (SOLO MANAGER) ---
                ListFooterComponent={
                    !isPlayerView ? (
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
                    ) : null
                }
            />

            {/* --- Modales (Sin cambios) --- */}
            <Modal visible={statsModalVisible} onRequestClose={() => setStatsModalVisible(false)} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <ScrollView>
                        <ViewShot ref={statsViewShotRef} options={{ format: 'png', quality: 0.9 }}>
                            <View style={styles.shareableContent}>
                                <Text style={styles.modalTitle}>{teamName} Season Stats</Text>
                                <View style={styles.statTableHeader}><Text style={styles.statPlayerNameHeader}>PLAYER</Text><Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text><Text style={styles.statCellHeader}>2B</Text><Text style={styles.statCellHeader}>3B</Text><Text style={styles.statCellHeader}>HR</Text><Text style={styles.statCellHeader}>BB</Text><Text style={styles.statCellHeader}>K</Text><Text style={styles.statCellHeader}>AVG</Text></View>
                                {processedData.table.map(item => <FullStatRow key={item.id} item={item} />)}
                            </View>
                        </ViewShot>
                    </ScrollView>
                    <Button title="Share Stats" onPress={() => handleShare(statsViewShotRef)} />
                    <Button title="Close" onPress={() => setStatsModalVisible(false)} color="gray" />
                </SafeAreaView>
            </Modal>

            <Modal visible={gameDetailModalVisible} onRequestClose={() => setGameDetailModalVisible(false)} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <ScrollView>
                        {selectedGame && (
                            <GameDetailModalContent
                                selectedGame={selectedGame}
                                teamId={teamId}
                                teamName={teamName}
                                viewShotRef={gameDetailViewShotRef}
                                onShare={handleShare}
                            />
                        )}
                    </ScrollView>
                    <Button title="Close" onPress={() => setGameDetailModalVisible(false)} color="gray" />
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

// --- COMPONENTE INTERNO PARA EL MODAL DE DETALLES (Sin cambios) ---
const GameDetailModalContent = ({ selectedGame, teamId, teamName, viewShotRef, onShare }) => {
    const isLeague = selectedGame.type === 'league_game';
    const isHome = isLeague && selectedGame.homeTeamId === teamId;
    const myModalTeamName = isLeague ? (isHome ? selectedGame.homeTeamName : selectedGame.awayTeamName) : teamName;
    const myModalScore = isLeague ? (isHome ? selectedGame.homeScore : selectedGame.awayScore) : (selectedGame.myScore || 0);
    const myModalBoxScore = isLeague ? (isHome ? selectedGame.homeBoxScore : selectedGame.awayBoxScore) : selectedGame.boxScore;
    const oppModalTeamName = isLeague ? (isHome ? selectedGame.awayTeamName : selectedGame.homeTeamName) : selectedGame.opponentName;
    const oppModalScore = isLeague ? (isHome ? selectedGame.awayScore : selectedGame.homeScore) : (selectedGame.opponentScore || 0);
    const oppModalBoxScore = isLeague ? (isHome ? selectedGame.awayBoxScore : selectedGame.homeBoxScore) : null;
    const hasAnyBoxScore = (myModalBoxScore && myModalBoxScore.length > 0) || (oppModalBoxScore && oppModalBoxScore.length > 0);
    return (
        <>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
                <View style={styles.shareableContent}>
                    <Text style={styles.modalTitle}>Game Results</Text>
                    <View style={styles.modalScoreContainer}>
                        <View style={styles.modalScoreTeam}> <Text style={styles.modalScoreName}>{oppModalTeamName}</Text> <Text style={styles.modalScoreNumber}>{oppModalScore}</Text> </View>
                        <View style={styles.modalScoreTeam}> <Text style={styles.modalScoreName}>{myModalTeamName}</Text> <Text style={styles.modalScoreNumber}>{myModalScore}</Text> </View>
                    </View>
                    <Text style={styles.boxScoreHeader}>{myModalTeamName} Box Score</Text>
                    {(myModalBoxScore && myModalBoxScore.length > 0) ? (<>
                        <View style={styles.statTableHeader}> <Text style={styles.statPlayerNameHeader}>PLAYER</Text> <Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text> <Text style={styles.statCellHeader}>2B</Text><Text style={styles.statCellHeader}>3B</Text> <Text style={styles.statCellHeader}>HR</Text><Text style={styles.statCellHeader}>BB</Text> <Text style={styles.statCellHeader}>K</Text><Text style={styles.statCellHeader}>AVG</Text> </View>
                        {myModalBoxScore.map(item => (item && (item.id || item.playerName) ? <FullStatRow key={item.id || item.playerName} item={item} /> : null))}
                    </>) : (<Text style={styles.emptyText}>Box score not available.</Text>)}
                    {oppModalBoxScore && (<>
                        <Text style={styles.boxScoreHeader}>{oppModalTeamName} Box Score</Text>
                        {(oppModalBoxScore.length > 0) ? (<>
                            <View style={styles.statTableHeader}> <Text style={styles.statPlayerNameHeader}>PLAYER</Text> <Text style={styles.statCellHeader}>AB</Text><Text style={styles.statCellHeader}>H</Text> <Text style={styles.statCellHeader}>2B</Text><Text style={styles.statCellHeader}>3B</Text> <Text style={styles.statCellHeader}>HR</Text><Text style={styles.statCellHeader}>BB</Text> <Text style={styles.statCellHeader}>K</Text><Text style={styles.statCellHeader}>AVG</Text> </View>
                            {oppModalBoxScore.map(item => (item && (item.id || item.playerName) ? <FullStatRow key={item.id || item.playerName} item={item} /> : null))}
                        </>) : (<Text style={styles.emptyText}>Opponent box score not available.</Text>)}
                    </>)}
                </View>
            </ViewShot>
            {hasAnyBoxScore && <Button title="Share Box Score" onPress={() => onShare(viewShotRef)} />}
        </>
    );
};
// --- FIN COMPONENTE MODAL ---

// --- ESTILOS (¡MODIFICADOS!) ---
const styles = StyleSheet.create({
    headerButtonContainer: { flexDirection: 'row', alignItems: 'center' },
    joinButton: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 5, marginRight: 10 },
    joinButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    header: { fontSize: 22, fontWeight: 'bold', marginHorizontal: 16, marginTop: 10, marginBottom: 10 },
    card: { backgroundColor: 'white', marginHorizontal: 16, borderRadius: 8, elevation: 2, marginBottom: 20, paddingTop: 15, paddingBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 15 },
    detailsLink: { color: '#3b82f6', fontWeight: '600' },
    statTableHeader: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 15, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#f9f9f9' },
    statPlayerNameHeader: { flex: 2, fontWeight: 'bold' },
    statCellHeader: { flex: 1, fontWeight: 'bold', textAlign: 'center' },
    statRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', alignItems: 'center' },
    statPlayerName: { flex: 2 },
    statCell: { flex: 1, textAlign: 'center' },
    leaderRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
    leaderStat: { fontWeight: 'bold', color: '#3b82f6', flex: 1 },
    leaderName: { flex: 2, textAlign: 'center' },
    leaderValue: { fontWeight: 'bold', flex: 1, textAlign: 'right' },
    gameItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', paddingLeft: 15, marginHorizontal: 16, marginBottom: 8, borderRadius: 6, elevation: 1 },
    leagueGameItemBorder: { borderColor: '#34d399', borderLeftWidth: 4 },
    gameItemInfo: { flex: 1, marginRight: 10 },
    gameOpponent: { fontSize: 16, fontWeight: '500' },
    gameDateText: { fontSize: 12, color: 'gray' },
    gameScore: { fontWeight: 'bold', fontSize: 18, minWidth: 50, textAlign: 'center' },
    forfeitButton: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 5, },
    gameActions: { flexDirection: 'row' },
    detailsButton: { backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 5, },
    validateButton: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 5, },
    deleteButton: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 5, marginLeft: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 20, padding: 16 },
    modalContainer: { flex: 1, backgroundColor: '#f5f7fa' },
    shareableContent: { backgroundColor: 'white' },
    modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, paddingTop: 20, backgroundColor: 'white' },
    modalScoreContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1f2937', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 8, marginHorizontal: 16, marginBottom: 20, elevation: 4, },
    modalScoreTeam: { alignItems: 'center', flex: 1, },
    modalScoreName: { fontSize: 18, fontWeight: 'bold', color: '#f3f4f6', textAlign: 'center', },
    modalScoreNumber: { fontSize: 36, fontWeight: 'bold', color: 'white', marginTop: 5, },
    boxScoreHeader: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 16, marginTop: 15, marginBottom: 10 },
    subHeaderCompact: { fontSize: 18, fontWeight: '700', color: '#1f2937', paddingTop: 8, paddingBottom: 5, paddingHorizontal: 15 },
    recordDisplay: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 10 },
    recordCompactText: { fontSize: 36, fontWeight: '900', color: '#1f2937' },
    competitionText: { fontSize: 16, fontWeight: '600', color: '#4b5563', textAlign: 'center', paddingBottom: 15, marginTop: -5, },
    rankText: { fontSize: 18, fontWeight: 'bold', color: '#1d4ed8', textAlign: 'center', paddingBottom: 15, marginTop: -10, },
    statusText: { fontSize: 10, fontWeight: 'bold', marginTop: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, overflow: 'hidden', alignSelf: 'flex-start', textTransform: 'capitalize' },
    status_scheduled: { backgroundColor: '#e0e7ff', color: '#4f46e5' },
    status_live: { backgroundColor: '#d1fae5', color: '#059669' },
    status_pending_validation: { backgroundColor: '#fef3c7', color: '#d97706' },
    status_completed: { backgroundColor: '#e5e7eb', color: '#4b5563' },
    status_unknown: { backgroundColor: '#f3f4f6', color: '#6b7280' },
    nextGameCard: { backgroundColor: '#e0f2fe', borderLeftWidth: 5, borderLeftColor: '#0ea5e9', paddingBottom: 20, },
    nextGameTitle: { fontSize: 16, fontWeight: 'bold', color: '#0ea5e9', textAlign: 'center', marginBottom: 15, textTransform: 'uppercase', },
    nextGameOpponent: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1f2937', marginBottom: 5, },
    logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
    teamLogo: { width: 120, height: 120, borderRadius: 60 },
    teamLogoPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
    teamLogoPlaceholderText: { fontSize: 50, fontWeight: 'bold', color: '#6b7280' },
    editLogoButton: { position: 'absolute', bottom: 5, right: '32%', backgroundColor: 'white', borderRadius: 15, padding: 6, elevation: 3 },
    editLogoText: { fontSize: 18 },
    nextGameDateTime: { fontSize: 16, color: '#4b5563', textAlign: 'center', marginBottom: 2, },
    locationText: { fontSize: 14, fontWeight: 'normal', color: 'gray' },
    nextGameLocation: { fontSize: 16, color: '#4b5563', textAlign: 'center', fontWeight: '500', marginTop: 8, paddingHorizontal: 10, },

    // --- ¡NUEVOS ESTILOS PARA EL BOTÓN WEB! ---
    webButton: {
        backgroundColor: '#10B981', // Mismo verde que el del Organizador
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
        marginHorizontal: 15, // Para que coincida con el padding de la tarjeta
    },
    webButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default StatsScreen;