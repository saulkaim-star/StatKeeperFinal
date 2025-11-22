import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const JoinCompetitionScreen = ({ navigation }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingTeamId, setLoadingTeamId] = useState(true);
  const [managerTeamId, setManagerTeamId] = useState(null);
  const [managerTeamName, setManagerTeamName] = useState('');
  const [teamIdError, setTeamIdError] = useState(null);

  const currentUser = auth().currentUser;

  // --- Find Manager's Team ID (Corrected for 'teams' array) ---
  useEffect(() => {
    if (!currentUser) {
        setTeamIdError('Not logged in.'); // <-- English
        setLoadingTeamId(false);
        return;
    }
    setLoadingTeamId(true);
    setTeamIdError(null);

    const userSubscriber = firestore()
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot(doc => {
        // Look for 'teams' array and take the first element
        if (doc.exists && doc.data().teams && doc.data().teams.length > 0) {
          const teamId = doc.data().teams[0]; // Take first ID from array

          setManagerTeamId(teamId);
          // Get team name
          firestore().collection('teams').doc(teamId).get().then(teamDoc => {
              if (teamDoc.exists) {
                  setManagerTeamName(teamDoc.data().teamName || '');
              }
              setLoadingTeamId(false);
          }).catch(err => {
              console.error("Error fetching team name: ", err);
              setTeamIdError('Could not fetch team name.'); // <-- English
              setLoadingTeamId(false);
          });
        } else {
          console.error("Manager user profile doesn't have a 'teams' array or it's empty.");
          setTeamIdError('Your user profile is missing team information. Please create a team first.'); // <-- English
          setLoadingTeamId(false);
        }
      }, error => {
          console.error("Error fetching user profile:", error);
          setTeamIdError('Could not load your user profile.'); // <-- English
          setLoadingTeamId(false);
      });
    return () => userSubscriber();
  }, [currentUser]);
  // --- END ---

  const handleJoin = async () => {
    const codeToSearch = inviteCode.trim().toUpperCase();
    if (codeToSearch === '') {
      Alert.alert('Error', 'Please enter an invite code.'); // <-- English
      return;
    }
    if (!currentUser) {
        Alert.alert('Error', 'You must be logged in.'); // <-- English
        return;
    }
    if (!managerTeamId) {
        Alert.alert('Error', teamIdError || 'Could not find your team ID.'); // <-- English
        return;
    }

    setLoadingJoin(true);

    try {
      const competitionQuery = await firestore()
        .collection('competitions')
        .where('inviteCode', '==', codeToSearch)
        .limit(1)
        .get();

      if (competitionQuery.empty) {
        Alert.alert('Not Found', 'No competition found with that invite code.'); // <-- English
        setLoadingJoin(false);
        return;
      }

      const competitionDoc = competitionQuery.docs[0];
      const competitionData = competitionDoc.data();
      const competitionId = competitionDoc.id;

      const alreadyJoinedQuery = await firestore()
        .collection('competition_teams')
        .where('competitionId', '==', competitionId)
        .where('teamId', '==', managerTeamId)
        .limit(1)
        .get();

      if (!alreadyJoinedQuery.empty) {
        Alert.alert('Already Joined', 'Your team is already part of this competition.'); // <-- English
        setLoadingJoin(false);
        navigation.goBack();
        return;
      }

      await firestore()
        .collection('competition_teams')
        .add({
          competitionId: competitionId,
          teamId: managerTeamId,
          teamName: managerTeamName || 'Unknown Team',
          managerId: currentUser.uid,
          joinedAt: firestore.FieldValue.serverTimestamp(),
          status: 'accepted',
        });

      Alert.alert('Success!', `Your team has joined "${competitionData.name}".`); // <-- English
      navigation.goBack();

    } catch (error) {
      console.error("Error joining competition: ", error);
      Alert.alert('Error', 'Could not join the competition.'); // <-- English
      setLoadingJoin(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* --- CORREGIDO --- */}
        <Text style={styles.title}>Join a Competition</Text>{/* <-- English */}
        <Text style={styles.subtitle}>
          Enter the invite code provided by the competition organizer.{/* <-- English */}
        </Text>
        {/* --- FIN DE LA CORRECCIÓN --- */}

        {loadingTeamId && <ActivityIndicator size="small" color="#0000ff" style={{marginBottom: 10}} />}
        {teamIdError && <Text style={styles.errorText}>{teamIdError}</Text>}

        <TextInput
          style={styles.input}
          placeholder="e.g., LIGA-SOL"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loadingTeamId}
        />

        {loadingJoin ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button
            title="Join Competition" // <-- English
            onPress={handleJoin}
            disabled={loadingTeamId || !managerTeamId}
           />
        )}
      </View>
    </SafeAreaView>
  );
};

// ... (Styles remain the same)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b700',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 24,
  },
  errorText: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 10,
  }
});

export default JoinCompetitionScreen;