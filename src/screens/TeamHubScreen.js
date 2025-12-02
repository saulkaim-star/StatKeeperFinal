import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- Tarjetas de Resumen ---
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

      <TouchableOpacity onPress={() => navigation.navigate('Announcements', { teamId, isPlayerView: false })}>
        <Text style={styles.viewAllText}>View All / Create →</Text>
      </TouchableOpacity>
    </View>
  );
};

const PollsCard = ({ navigation, teamId }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Polls', { teamId })}
      disabled={!teamId}
    >
      <Text style={styles.cardTitle}>🗳️ Polls</Text>
      <Text style={styles.communityPostText}>
        Create and manage team polls and votes.
      </Text>
      <Text style={styles.viewAllText}>Manage Polls →</Text>
    </TouchableOpacity>
  );
};
// --- Fin de Tarjetas de Resumen ---


const TeamHubScreen = ({ route, navigation }) => {

  // 1. DEFINICIÓN DE VARIABLES DE PARÁMETROS
  const teamId = route?.params?.teamId || null;
  const teamName = 'Team Hub';

  // 2. INICIO DE HOOKS
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [competitionId, setCompetitionId] = useState(null);
  const [loadingCompId, setLoadingCompId] = useState(true);

  // Hook para fijar el título de la navegación
  useLayoutEffect(() => {
    navigation.setOptions({
      title: teamName || 'Team Hub',
    });
  }, [navigation, teamName]);

  // Hook de Datos
  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      setLoadingCompId(false);
      return;
    }

    setLoading(true);
    setLoadingCompId(true);

    // 1. Buscador de Anuncios
    const announcementsSubscriber = firestore()
      .collection('teams').doc(teamId).collection('announcements')
      .orderBy('createdAt', 'desc').limit(3).onSnapshot(querySnapshot => {
        const announcementsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), }));
        setAnnouncements(announcementsList);
        setLoading(false);
      }, error => {
        console.error("Error fetching announcements:", error);
        setLoading(false);
      });

    // 2. Buscador de CompetitionId
    const compTeamSubscriber = firestore().collection('competition_teams')
      .where('teamId', '==', teamId).limit(1).onSnapshot(snap => {
        if (!snap.empty) {
          setCompetitionId(snap.docs[0].data().competitionId);
        } else {
          setCompetitionId(null);
        }
        setLoadingCompId(false);
      }, err => {
        console.error("Error fetching competition link:", err);
        setLoadingCompId(false);
      });

    return () => {
      announcementsSubscriber();
      compTeamSubscriber();
    };
  }, [teamId]);


  // --- CONDICIONALES DE RETORNO (DEBEN IR AL FINAL) ---
  if (!teamId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Team information not available.</Text>
      </View>
    );
  }

  if (loading || loadingCompId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.errorText}>Loading hub data...</Text>
      </View>
    );
  }

  // --- ESTRUCTURA DE RENDERIZADO FINAL ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>

        <View style={styles.section}>

          <CommunityPostsCard
            navigation={navigation}
            teamId={teamId}
            competitionId={competitionId}
          />

          <PollsCard navigation={navigation} teamId={teamId} />

          <RecentAnnouncements
            announcements={announcements}
            navigation={navigation}
            teamId={teamId}
          />

        </View>

        {/* BOTÓN ELIMINADO DE AQUÍ - MOVIDO A STATSSCREEN */}

      </ScrollView>
    </SafeAreaView>
  );
};

// --- ESTILOS --- (Sin cambios)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
  section: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
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
  communityPostText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
  },
  announcementText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 5,
    lineHeight: 20,
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
});

export default TeamHubScreen;