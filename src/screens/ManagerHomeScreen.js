import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const ManagerHomeScreen = ({ navigation }) => {
  const [teamInfo, setTeamInfo] = useState({ id: null, name: 'Loading...' });

  // --- ¡CAMBIO 1: Añadir estado para el competitionId! ---
  const [competitionId, setCompetitionId] = useState(null);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    const userId = currentUser.uid;

    // --- Preparamos el listener para el 'competitionId' ---
    let compSubscriber = () => { };

    const subscriber = firestore()
      .collection('teams')
      .where('managerId', '==', userId)
      .limit(1)
      .onSnapshot(querySnapshot => {
        if (querySnapshot && !querySnapshot.empty) {
          const teamDoc = querySnapshot.docs[0];
          const teamId = teamDoc.id; // Obtenemos el teamId
          setTeamInfo({ id: teamId, name: teamDoc.data().teamName });

          // --- ¡CAMBIO 2: Buscar el competitionId AHORA que tenemos el teamId! ---
          compSubscriber(); // Limpiamos el listener anterior
          compSubscriber = firestore().collection('competition_teams')
            .where('teamId', '==', teamId)
            .limit(1)
            .onSnapshot(compSnap => {
              if (compSnap && !compSnap.empty) {
                // ¡Encontrado! Lo guardamos
                setCompetitionId(compSnap.docs[0].data().competitionId);
              } else {
                setCompetitionId(null);
              }
            });
          // --- Fin del Cambio 2 ---

        } else {
          setTeamInfo({ id: null, name: 'No team found' });
          setCompetitionId(null); // Limpiamos si no hay equipo
        }
      }, error => {
        console.error("Error fetching team:", error);
        setTeamInfo({ id: null, name: 'Error loading team' });
      });

    // Limpiamos AMBOS listeners al salir
    return () => {
      subscriber();
      compSubscriber();
    };
  }, []);

  const handleLogout = () => {
    auth().signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manager Dashboard</Text>
        <Text style={styles.subtitle}>Managing: {teamInfo.name}</Text>
      </View>

      <View style={styles.menuContainer}>
        {/* Los otros botones no necesitan el competitionId... */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Roster', { teamId: teamInfo.id })}
          disabled={!teamInfo.id}
        >
          <Text style={styles.menuButtonText}>ЁЯСе Manage Roster</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('StartGame', { teamId: teamInfo.id })}
          disabled={!teamInfo.id}
        >
          <Text style={styles.menuButtonText}>ЁЯПЯя╕П Start New Game</Text>
        </TouchableOpacity>

        {/* --- ¡CAMBIO 3: Pasar el competitionId al 'TeamHub'! --- */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('TeamHub', {
            teamId: teamInfo.id,
            teamName: teamInfo.name,
            competitionId: competitionId // <-- ¡Añadido!
          })}
          // Desactivamos el botón si falta el competitionId
          disabled={!teamInfo.id || !competitionId}
        >
          <Text style={styles.menuButtonText}>ЁЯУг Team Hub</Text>
        </TouchableOpacity>
        {/* --- Fin del Cambio 3 --- */}

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('Stats', { teamId: teamInfo.id, teamName: teamInfo.name })}
          disabled={!teamInfo.id}
        >
          <Text style={styles.menuButtonText}>ЁЯУК Stats & History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoutContainer}>
        <Button title="Log Out" onPress={handleLogout} color="#ef4444" />
        <TouchableOpacity
          style={{ marginTop: 15, alignItems: 'center' }}
          onPress={handleDeleteAccount}
        >
          <Text style={{ color: '#9ca3af', fontSize: 14, textDecorationLine: 'underline' }}>
            Delete Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- (Los estilos no cambian) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginTop: 4,
  },
  menuContainer: {
    padding: 24,
  },
  menuButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  menuButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  logoutContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    margin: 24,
  },
});

export default ManagerHomeScreen;