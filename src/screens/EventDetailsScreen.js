// src/screens/EventDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Button, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ATTENDANCE_STATUSES = {
    GOING: 'going',
    NOT_GOING: 'not_going',
    PENDING: 'pending',
};

// Componente para mostrar el estado de un jugador
const PlayerAttendanceItem = ({ player, attendanceStatus }) => {
    let statusText = 'Pending';
    let statusColor = '#9ca3af'; // Gris

    if (attendanceStatus === ATTENDANCE_STATUSES.GOING) {
        statusText = 'GOING';
        statusColor = '#10b981'; // Verde
    } else if (attendanceStatus === ATTENDANCE_STATUSES.NOT_GOING) {
        statusText = 'NOT GOING';
        statusColor = '#ef4444'; // Rojo
    }

    return (
        <View style={styles.playerItem}>
            <Text style={styles.playerName}>{player.playerName || player.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                <Text style={styles.statusText}>{statusText}</Text>
            </View>
        </View>
    );
};

const EventDetailsScreen = ({ route, navigation }) => {
    const { eventId, teamId } = route.params;
    const currentUserId = auth().currentUser?.uid;

    const [eventData, setEventData] = useState(null);
    const [players, setPlayers] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const isManager = userProfile?.role === 'manager';

    // 1. Obtener el Perfil del Usuario (para saber si es manager o jugador)
    useEffect(() => {
        if (!currentUserId) return;
        const unsubUser = firestore().collection('users').doc(currentUserId).onSnapshot(doc => {
            setUserProfile(doc.data());
        });
        return () => unsubUser();
    }, [currentUserId]);

    // 2. Obtener Detalles del Evento en Tiempo Real
    useEffect(() => {
        if (!eventId || !teamId) return;

        const unsubEvent = firestore()
            .collection('teams').doc(teamId).collection('events').doc(eventId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    setEventData({ id: doc.id, ...doc.data() });
                } else {
                    Alert.alert('Error', 'Event not found.');
                    navigation.goBack();
                }
                setIsLoading(false);
            }, error => {
                console.error("Error fetching event:", error);
                setIsLoading(false);
            });

        return () => unsubEvent();
    }, [eventId, teamId]);

    // 3. Obtener la Lista de Jugadores del Equipo
    useEffect(() => {
        if (!teamId) return;

        const unsubPlayers = firestore()
            .collection('teams').doc(teamId).collection('roster')
            .onSnapshot(querySnapshot => {
                const fetchedPlayers = [];
                querySnapshot.forEach(doc => {
                    fetchedPlayers.push({ id: doc.id, ...doc.data() });
                });
                setPlayers(fetchedPlayers);
            }, error => {
                console.error("Error fetching players:", error);
            });

        return () => unsubPlayers();
    }, [teamId]);

    // Función para registrar la asistencia
    const handleSetAttendance = async (status) => {
        if (!eventData || !currentUserId) return;

        try {
            const updateData = {
                [`attendees.${currentUserId}`]: status,
            };

            await firestore().collection('teams').doc(teamId).collection('events').doc(eventId).update(updateData);
        } catch (error) {
            console.error("Error updating attendance:", error);
            Alert.alert('Error', 'Could not update attendance.');
        }
    };

    if (isLoading || !userProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10 }}>Loading details...</Text>
            </View>
        );
    }

    if (!eventData) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Could not load event data.</Text>
            </View>
        );
    }

    const eventDate = eventData.dateTime?.toDate();
    const formattedDate = eventDate?.toLocaleDateString([], { 
        weekday: 'long', day: 'numeric', month: 'long' 
    });
    const formattedTime = eventDate?.toLocaleTimeString([], { 
        hour: '2-digit', minute: '2-digit' 
    });
    
    const currentUserStatus = eventData.attendees?.[currentUserId] || ATTENDANCE_STATUSES.PENDING;

    const totalPlayers = players.length;
    const attendees = eventData.attendees || {};
    const goingCount = Object.values(attendees).filter(s => s === ATTENDANCE_STATUSES.GOING).length;
    const notGoingCount = Object.values(attendees).filter(s => s === ATTENDANCE_STATUSES.NOT_GOING).length;
    const pendingCount = totalPlayers - goingCount - notGoingCount;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content}>
                
                <View style={styles.infoCard}>
                    <Text style={styles.eventTitle}>{eventData.title}</Text>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Time:</Text>
                        <Text style={styles.detailValue}>{formattedTime}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{eventData.location}</Text>
                    </View>
                </View>

                <View style={styles.attendanceCard}>
                    <Text style={styles.cardHeader}>Will you attend?</Text>
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity 
                            style={[styles.attButton, styles.goingButton, currentUserStatus === ATTENDANCE_STATUSES.GOING && styles.activeButton]} 
                            onPress={() => handleSetAttendance(ATTENDANCE_STATUSES.GOING)}
                        >
                            <Text style={styles.attButtonText}>Going</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.attButton, styles.notGoingButton, currentUserStatus === ATTENDANCE_STATUSES.NOT_GOING && styles.activeButton]} 
                            onPress={() => handleSetAttendance(ATTENDANCE_STATUSES.NOT_GOING)}
                        >
                            <Text style={styles.attButtonText}>Not Going</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                
                {isManager && (
                    <View style={styles.rosterCard}>
                        <Text style={styles.cardHeader}>Attendance Summary ({totalPlayers} Players)</Text>
                        
                        <View style={styles.summaryGrid}>
                            <View style={[styles.summaryItem, { backgroundColor: '#d1fae5' }]}>
                                <Text style={[styles.summaryCount, { color: '#059669' }]}>{goingCount}</Text>
                                <Text style={styles.summaryLabel}>Going</Text>
                            </View>
                            <View style={[styles.summaryItem, { backgroundColor: '#fee2e2' }]}>
                                <Text style={[styles.summaryCount, { color: '#dc2626' }]}>{notGoingCount}</Text>
                                <Text style={styles.summaryLabel}>Not Going</Text>
                            </View>
                            <View style={[styles.summaryItem, { backgroundColor: '#fef3c7' }]}>
                                <Text style={[styles.summaryCount, { color: '#f59e0b' }]}>{pendingCount}</Text>
                                <Text style={styles.summaryLabel}>Pending</Text>
                            </View>
                        </View>
                        
                        <Text style={styles.rosterListHeader}>Roster Details:</Text>
                        {players.map(item => (
                            <PlayerAttendanceItem 
                                key={item.id}
                                player={item} 
                                attendanceStatus={attendees[item.id] || ATTENDANCE_STATUSES.PENDING}
                            />
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: { padding: 15 },
    infoCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, borderLeftWidth: 5, borderLeftColor: '#3b82f6', elevation: 2, },
    attendanceCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', elevation: 2, },
    rosterCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 30, elevation: 2, },
    cardHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#1f2937' },
    eventTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 15 },
    detailRow: { flexDirection: 'row', marginBottom: 5 },
    detailLabel: { fontWeight: '600', width: 80, color: '#4b5563' },
    detailValue: { flex: 1, color: '#1f2937' },
    buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    attButton: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    goingButton: { backgroundColor: '#10b981' },
    notGoingButton: { backgroundColor: '#ef4444' },
    activeButton: { borderColor: '#3b82f6' },
    attButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    summaryItem: { flex: 1, padding: 10, marginHorizontal: 5, borderRadius: 8, alignItems: 'center' },
    summaryCount: { fontSize: 28, fontWeight: 'bold' },
    summaryLabel: { fontSize: 12, color: '#4b5563', marginTop: 2 },
    rosterListHeader: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 10, color: '#1f2937' },
    playerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    playerName: { fontSize: 16, color: '#1f2937', flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});

export default EventDetailsScreen;