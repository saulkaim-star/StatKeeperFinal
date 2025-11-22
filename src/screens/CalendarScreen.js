import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react'; // <--- useMemo añadido
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

// Componente para Eventos Privados (Sin Cambios)
const EventItem = ({ item, onDelete, isPlayerView }) => {
    // ... (Tu código de EventItem es perfecto, sin cambios)
    const navigation = useNavigation();
    const eventDate = item.dateTime?.toDate();
    const formattedDate = eventDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = eventDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return (
        <View style={styles.itemWrapper}>
            <TouchableOpacity
                style={[styles.itemContainer, styles.eventContainer]}
                onPress={() => navigation.navigate('EventDetails', { eventId: item.id, teamId: item.teamId })}
            >
                <View style={[styles.dateBox, styles.eventDateBox]}>
                    <Text style={styles.dateText}>{formattedDate || 'Date?'}</Text>
                </View>
                <View style={styles.detailsBox}>
                    <Text style={styles.itemTitle}>{item.title || 'Untitled Event'}</Text>
                    {item.location && (
                        <Text style={styles.gameLocationText}>📍 {item.location}</Text>
                    )}
                    <Text style={styles.itemType}>Event</Text>
                </View>
            </TouchableOpacity>
            {!isPlayerView && (
                <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Componente para Juegos de Liga (Sin Cambios)
const LeagueGameItem = ({ item, teamId, isPlayerView }) => {
    // ... (Tu código de LeagueGameItem es perfecto, sin cambios)
    const navigation = useNavigation();
    const gameDate = item.gameDate?.toDate();
    const formattedDate = gameDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = gameDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isHome = item.homeTeamId === teamId;
    const opponentName = isHome ? item.awayTeamName : item.homeTeamName;
    const gameTitle = `vs ${opponentName}`;
    const locationText = isHome ? '(Home)' : '(Away)';

    const isCompleted = item.status === 'completed';
    const isPastOrPending = isCompleted || item.status === 'pending_validation';
    const statusText = item.status ? item.status.replace('_', ' ') : `Scheduled at ${formattedTime || '?'}`;

    const canPress = !isPlayerView && !isCompleted;

    return (
        <View style={styles.itemWrapper}>
            <TouchableOpacity
                style={[
                    styles.itemContainer,
                    styles.gameContainer,
                    isPastOrPending && styles.playedGameContainer
                ]}
                disabled={!canPress} 
                onPress={() => {
                    if (canPress) { 
                        navigation.navigate('SelectLineup', {
                            teamId: teamId, opponentName: opponentName,
                            locationStatus: isHome ? 'home' : 'away',
                            isLeagueGame: true, leagueGameId: item.id, competitionId: item.competitionId,
                            gameLocation: item.location
                        });
                    }
                }}
            >
                <View style={[styles.dateBox, styles.gameDateBox, isPastOrPending && styles.playedDateBox]}>
                    <Text style={styles.dateText}>{formattedDate || 'Date?'}</Text>
                </View>
                <View style={styles.detailsBox}>
                    <Text style={styles.itemTitle}>{gameTitle} <Text style={styles.locationText}>{locationText}</Text></Text>
                    <Text style={[styles.itemDetails, isPastOrPending && styles.playedStatusText]}>{statusText}</Text>
                    
                    {item.location && (
                        <Text style={styles.gameLocationText}>📍 {item.location}</Text>
                    )}
                    
                    <Text style={styles.itemType}>League Game</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

// --- Pantalla Principal (MODIFICADA) ---
const CalendarScreen = ({ route }) => {
    const navigation = useNavigation();
    const { teamId, isPlayerView } = route.params || {};
    
    // --- ESTADOS REORGANIZADOS ---
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingGames, setLoadingGames] = useState(true);
    const [loadingCompetition, setLoadingCompetition] = useState(true); // <--- NUEVO
    
    const [privateEvents, setPrivateEvents] = useState([]); // <-- Nuevo
    const [leagueGames, setLeagueGames] = useState([]); // <-- Nuevo
    const [competitionId, setCompetitionId] = useState(null); // <--- NUEVO

    useLayoutEffect(() => {
        // ... (Tu código 'useLayoutEffect' es perfecto, sin cambios)
        if (!isPlayerView) {
            navigation.setOptions({
                title: 'Team Calendar',
                headerRight: () => ( <Button onPress={() => navigation.navigate('CreateEvent', { teamId })} title="+" /> ),
            });
        } else {
             navigation.setOptions({ title: 'Team Calendar' });
        }
    }, [navigation, teamId, isPlayerView]);


    // --- INICIO DE LA LÓGICA CORREGIDA ---

    // EFECTO 1: Encontrar la liga ACTIVA
    // (Esta es la misma lógica automática que pusimos en StatsScreen.js)
    useEffect(() => {
        if (!teamId) {
            setLoadingCompetition(false);
            return;
        }
        setLoadingCompetition(true);
        let compDetailsSubscriber = () => {};

        const compTeamSubscriber = firestore().collection('competition_teams').where('teamId', '==', teamId).limit(1)
            .onSnapshot(querySnapshot => {
                compDetailsSubscriber(); // Limpia el listener anterior

                if (!querySnapshot.empty) {
                    const compLinkDoc = querySnapshot.docs[0];
                    const compId = compLinkDoc.data().competitionId;
                    if (!compId) {
                        setCompetitionId(null);
                        setLoadingCompetition(false);
                        return;
                    }

                    compDetailsSubscriber = firestore().collection('competitions').doc(compId)
                        .onSnapshot(compDoc => {
                            // Si la liga existe Y NO está completada/archivada
                            if (compDoc.exists && compDoc.data().status !== 'completed' && compDoc.data().status !== 'archived') {
                                setCompetitionId(compId);
                            } else {
                                // La liga está completada o no existe
                                setCompetitionId(null);
                                // Si la liga está completada, borramos el vínculo
                                if (compDoc.exists) {
                                    compLinkDoc.ref.delete().catch(e => console.error("Calendar: Failed to clean up old league link", e));
                                }
                            }
                            setLoadingCompetition(false);
                        }, err => {
                            console.error("Calendar: Error listening to comp details", err);
                            setCompetitionId(null);
                            setLoadingCompetition(false);
                        });
                } else {
                    // El equipo no está en ninguna liga
                    setCompetitionId(null);
                    setLoadingCompetition(false);
                }
            }, err => {
                console.error("Calendar: Error searching comp_teams", err);
                setLoadingCompetition(false);
            });

        return () => {
            compTeamSubscriber();
            compDetailsSubscriber();
        };
    }, [teamId]);

    // EFECTO 2: Cargar eventos PRIVADOS (Sin cambios)
    useEffect(() => {
        if (!teamId) {
            setLoadingEvents(false);
            return;
        }
        setLoadingEvents(true);
        const eventsSubscriber = firestore().collection('teams').doc(teamId).collection('events').orderBy('dateTime', 'asc')
            .onSnapshot(querySnapshot => {
                const eventsList = [];
                if (querySnapshot) {
                    querySnapshot.forEach(doc => {
                        eventsList.push({ type: 'event', id: doc.id, teamId: teamId, sortDate: doc.data().dateTime?.toDate(), ...doc.data() });
                    });
                }
                setPrivateEvents(eventsList);
                setLoadingEvents(false);
            }, error => {
                console.error("CalendarScreen: Error fetching events:", error);
                setLoadingEvents(false);
            });
        return () => eventsSubscriber();
    }, [teamId]);

    // EFECTO 3: Cargar juegos de la LIGA (¡depende de competitionId!)
    useEffect(() => {
        if (!teamId || !competitionId) { // Si no hay liga activa
            setLeagueGames([]); // Limpiamos los juegos de la liga anterior
            setLoadingGames(false);
            return () => {}; // No hay nada que limpiar
        }

        console.log(`CalendarScreen: Setting up LEAGUE GAME listeners for active competition: ${competitionId}`); 
        setLoadingGames(true);
        
        // ¡FILTRO AÑADIDO!
        const homeGamesQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionId) // <--- ¡LA CORRECCIÓN!
            .where('homeTeamId', '==', teamId)
            .orderBy('gameDate', 'asc');
        
        // ¡FILTRO AÑADIDO!
        const awayGamesQuery = firestore().collection('competition_games')
            .where('competitionId', '==', competitionId) // <--- ¡LA CORRECCIÓN!
            .where('awayTeamId', '==', teamId)
            .orderBy('gameDate', 'asc');
        
        let gamesMap = {}; 
        const handleSnapshot = (querySnapshot, type) => {
            let changed = false;
            if (querySnapshot) {
                querySnapshot.forEach(doc => { const gameData = { type: 'league_game', id: doc.id, teamId: teamId, sortDate: doc.data().gameDate?.toDate(), ...doc.data() }; if (!gamesMap[doc.id] || gamesMap[doc.id].status !== gameData.status) { gamesMap[doc.id] = gameData; changed = true; } });
                const currentIdsInSnapshot = new Set(querySnapshot.docs.map(d => d.id)); 
                Object.keys(gamesMap).forEach(gameId => { const game = gamesMap[gameId]; const isRelevantType = (type === 'HOME' && game.homeTeamId === teamId) || (type === 'AWAY' && game.awayTeamId === teamId); if(isRelevantType && !currentIdsInSnapshot.has(gameId)) { delete gamesMap[gameId]; changed = true; } });
            }
            if (changed) { 
                setLeagueGames(Object.values(gamesMap)); // Actualiza el estado de juegos de liga
            }
            setLoadingGames(false); 
        };
        const handleError = (error, type) => { console.error(`CalendarScreen: Error fetching ${type} league games:`, error); setLoadingGames(false); };
        
        const homeSubscriber = homeGamesQuery.onSnapshot(snap => handleSnapshot(snap, 'HOME'), err => handleError(err, 'HOME'));
        const awaySubscriber = awayGamesQuery.onSnapshot(snap => handleSnapshot(snap, 'AWAY'), err => handleError(err, 'AWAY'));

        return () => { 
            console.log("CalendarScreen: Cleaning up game listeners."); 
            homeSubscriber(); 
            awaySubscriber(); 
        };
    }, [teamId, competitionId]); // <--- ¡LA DEPENDENCIA CLAVE!

    // --- FIN DE LA LÓGICA CORREGIDA ---


    // Combinamos las listas para el FlatList
    const allItems = useMemo(() => {
        return [...privateEvents, ...leagueGames].sort((a, b) => (a.sortDate || 0) - (b.sortDate || 0));
    }, [privateEvents, leagueGames]);


    const handleDeleteEvent = (eventId) => { Alert.alert( "Delete Event", "Are you sure?", [ { text: "Cancel"}, { text: "Delete", style: "destructive", onPress: () => { firestore().collection('teams').doc(teamId).collection('events').doc(eventId).delete().catch(error => Alert.alert("Error", "Could not delete event.")); }, }, ] ); };

    // Actualizamos el estado de carga
    if (loadingEvents || loadingGames || loadingCompetition) { 
        return <View style={styles.center}><ActivityIndicator size="large" /></View>; 
    }
    
    if (!teamId) { 
        return ( <View style={styles.center}><Text style={styles.errorText}>Team information not available.</Text></View> ); 
    }

    const renderItem = ({ item }) => {
        if (item.type === 'event') { 
            return ( <EventItem item={item} isPlayerView={isPlayerView} onDelete={handleDeleteEvent} /> ); 
        } 
        else if (item.type === 'league_game') { 
            return ( <LeagueGameItem item={item} teamId={teamId} isPlayerView={isPlayerView} /> ); 
        }
        return null;
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList 
                data={allItems} // <--- Usamos la lista combinada
                renderItem={renderItem} 
                keyExtractor={item => item.type + '_' + item.id} 
                ListEmptyComponent={<Text style={styles.emptyText}>No upcoming events or games.</Text>} 
                contentContainerStyle={{ padding: 10 }} 
            />
        </SafeAreaView>
    );
};

// --- Estilos (Sin cambios) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16 },
    itemWrapper: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6, marginVertical: 8, },
    itemContainer: { flex: 1, flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, elevation: 2, overflow: 'hidden' },
    eventContainer: { borderLeftWidth: 5, borderLeftColor: '#60a5fa' }, 
    gameContainer: { borderLeftWidth: 5, borderLeftColor: '#34d399' }, 
    playedGameContainer: {
        opacity: 0.7, 
        backgroundColor: '#e5e7eb', 
        borderLeftColor: '#9ca3af', 
     },
    dateBox: { padding: 15, justifyContent: 'center', alignItems: 'center', minWidth: 70 },
    eventDateBox: { backgroundColor: '#3b82f6' }, 
    gameDateBox: { backgroundColor: '#10b981' }, 
    playedDateBox: {
        backgroundColor: '#6b7280' 
    },
    dateText: { color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
    detailsBox: { flex: 1, padding: 15 },
    itemTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
    locationText: { fontSize: 14, fontWeight: 'normal', color: 'gray' }, 
    itemDetails: { fontSize: 14, color: 'gray', marginTop: 4 },
    playedStatusText: {
        color: '#4b5563', 
        fontStyle: 'italic', 
        textTransform: 'capitalize' 
    },
    itemType: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', marginTop: 5, textTransform: 'uppercase' },
    deleteButton: { backgroundColor: '#fee2e2', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: 10, elevation: 2 },
    deleteButtonText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
    gameLocationText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        marginTop: 4,
    },
});

export default CalendarScreen;