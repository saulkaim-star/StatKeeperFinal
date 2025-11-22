import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// --- Pequeños componentes del Dashboard (Corregido) ---
const RecentAnnouncements = ({ announcements, navigation, teamId }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>📢 Announcements</Text>
            {announcements.length > 0 ? (
                announcements.map(item => (
                    <Text key={item.id} style={styles.announcementText}>• {item.text}</Text>
                ))
            ) : (
                <Text style={styles.noDataText}>No recent announcements.</Text>
            )}
            
            {/* Corrección previa para 'isPlayerView' */}
            <TouchableOpacity onPress={() => navigation.navigate('Announcements', { teamId, isPlayerView: true })}>
                <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
        </View>
    );
};

// --- CORREGIDO: Renombramos 'LatestPoll' a 'HubPoll' para claridad ---
const HubPoll = ({ poll, teamId, navigation }) => {
    if (!poll) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>🗳️ Polls</Text>
                <Text style={styles.noDataText}>No polls available yet.</Text>
            </View>
        );
    }
    return (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PollDetails', { pollId: poll.id, teamId })}>
            <Text style={styles.cardTitle}>{poll.isActive ? 'Active Poll' : 'Latest Poll Result'}</Text>
            <Text style={styles.pollQuestion}>{poll.question}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Polls', { teamId, isPlayerView: true })}>
                 <Text style={styles.viewAllText}>View All Polls →</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

// --- Componente para "Community Posts" (Sin cambios) ---
const CommunityPostsCard = ({ navigation, teamId, competitionId }) => {
    return (
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => navigation.navigate('CreateMediaPost', { teamId, competitionId })}
          disabled={!teamId || !competitionId}
        >
            <Text style={styles.cardTitle}>📸 Community Posts</Text>
            <Text style={styles.communityPostText}>
                Share photos & videos with your team.
            </Text>
            <Text style={styles.viewAllText}>Create New Post →</Text>
        </TouchableOpacity>
    );
};


// --- Componente Principal (Corregido) ---
const HubScreen = () => {
  const navigation = useNavigation();
  const [teamId, setTeamId] = useState(null);
  const [competitionId, setCompetitionId] = useState(null); 
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [latestPoll, setLatestPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
            setTeamId(null);
            setError("You are not associated with any team.");
            setLoading(false);
            return;
        }
        
        setTeamId(currentTeamId);
        setLoading(false);

      }, err => {
        console.error("Error fetching user profile:", err);
        setError(err.message);
        setLoading(false);
      });

    return () => userSubscriber();
  }, []);

  useEffect(() => {
    if (!teamId) return; 

    const compTeamSubscriber = firestore().collection('competition_teams')
      .where('teamId', '==', teamId).limit(1)
      .onSnapshot(snap => {
        if (!snap.empty) {
            setCompetitionId(snap.docs[0].data().competitionId); 
        } else {
            setCompetitionId(null); 
        }
      }, err => console.error("Error fetching competition link:", err));


    const announcementSubscriber = firestore().collection('teams').doc(teamId).collection('announcements')
      .orderBy('createdAt', 'desc').limit(2)
      .onSnapshot(snap => {
        if (!snap.empty) setRecentAnnouncements(snap.docs.map(d => ({id: d.id, ...d.data()})));
        else setRecentAnnouncements([]);
      }, err => console.error("Error fetching announcements:", err));

    // --- ¡CORRECCIÓN EN LA CONSULTA DE POLLS! ---
    // Eliminamos el filtro 'where('isActive', '==', true)'
    // para que muestre la ÚLTIMA encuesta, igual que 'My Profile'.
    const pollSubscriber = firestore().collection('teams').doc(teamId).collection('polls')
      .orderBy('createdAt', 'desc').limit(1)
      .onSnapshot(snap => {
        if (!snap.empty) {
            const pollData = snap.docs[0].data();
            setLatestPoll({ id: snap.docs[0].id, ...pollData });
        }
        else setLatestPoll(null);
      }, err => console.error("Error fetching polls:", err));
    // --- FIN DE LA CORRECCIÓN ---

    return () => {
      compTeamSubscriber(); 
      announcementSubscriber();
      pollSubscriber();
    };
  }, [teamId]); 

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!teamId) {
    return (
      <View style={styles.noTeamContainer}>
        <Text style={styles.noTeamText}>You are not part of any team yet.</Text>
        <TouchableOpacity style={styles.joinTeamButton} onPress={() => navigation.navigate('JoinTeam')}>
          <Text style={styles.joinTeamButtonText}>Join or Create a Team</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <RecentAnnouncements announcements={recentAnnouncements} navigation={navigation} teamId={teamId} />
      
      {/* --- CORREGIDO: Usamos el componente HubPoll --- */}
      <HubPoll poll={latestPoll} navigation={navigation} teamId={teamId} />
      
      {teamId && competitionId && (
        <CommunityPostsCard 
          navigation={navigation} 
          teamId={teamId} 
          competitionId={competitionId} 
        />
      )}
    </ScrollView>
  );
};

// --- (Los estilos no cambian) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', paddingVertical: 15 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151', 
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 5,
    },
    announcementText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
    },
    pollQuestion: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        marginBottom: 5,
    },
    pollVotes: {
        fontSize: 14,
        color: '#6b7280',
        fontStyle: 'italic',
    },
    noDataText: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    },
    viewAllText: {
        fontSize: 14,
        color: '#3b82f6',
        fontWeight: 'bold',
        textAlign: 'right',
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
    noTeamContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f5f7fa',
    },
    noTeamText: {
        fontSize: 18,
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 20,
    },
    joinTeamButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        elevation: 3,
    },
    joinTeamButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    communityPostText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 5,
    }
});

export default HubScreen;