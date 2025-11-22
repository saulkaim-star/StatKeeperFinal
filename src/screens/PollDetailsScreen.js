import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const PollDetailsScreen = ({ route }) => {
  const { pollId, teamId } = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  
  const currentUserId = auth().currentUser?.uid;

  useEffect(() => {
    const subscriber = firestore()
      .collection('teams').doc(teamId).collection('polls').doc(pollId)
      .onSnapshot(doc => {
        if (doc.exists) {
          setPoll({ id: doc.id, ...doc.data() });
        } else {
          Alert.alert("Error", "Poll not found.");
        }
        setLoading(false);
      });
    return () => subscriber();
  }, [teamId, pollId]);

  const handleVote = async (optionIndex) => {
    if (!currentUserId || isVoting) return;

    setIsVoting(true);
    try {
      await firestore().collection('teams').doc(teamId).collection('polls').doc(pollId).update({
        [`votes.${currentUserId}`]: optionIndex
      });
    } catch (error) {
      console.error("Error voting:", error);
      Alert.alert('Error', 'Could not cast your vote.');
    } finally {
      setIsVoting(false);
    }
  };
  
  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  if (!poll) {
    return <View style={styles.center}><Text>Could not load poll data.</Text></View>;
  }

  const totalVotes = Object.keys(poll.votes || {}).length;
  const userVote = poll.votes?.[currentUserId];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.question}>{poll.question}</Text>
        <Text style={styles.totalVotesText}>Total Votes: {totalVotes}</Text>

        <View style={styles.optionsContainer}>
          {poll.options.map((option, index) => {
            const votesForOption = Object.values(poll.votes || {}).filter(v => v === index).length;
            const percentage = totalVotes > 0 ? (votesForOption / totalVotes) * 100 : 0;
            const isSelected = userVote === index;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionWrapper, isSelected && styles.selectedOption]}
                onPress={() => handleVote(index)}
                disabled={isVoting}
              >
                <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                <View style={styles.optionContent}>
                    <Text style={styles.optionText}>{option}</Text>
                    <Text style={styles.percentageText}>{votesForOption} ({percentage.toFixed(0)}%)</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {isVoting && <ActivityIndicator style={{ marginTop: 20 }}/>}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 20, elevation: 3 },
  question: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 },
  totalVotesText: { fontSize: 16, color: 'gray', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10 },
  optionsContainer: {},
  optionWrapper: { borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 10, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  selectedOption: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  progressBar: { backgroundColor: '#dbeafe', position: 'absolute', left: 0, top: 0, bottom: 0 },
  optionContent: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, zIndex: 1 },
  optionText: { fontSize: 16, color: '#1f2937', fontWeight: '500' },
  percentageText: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6' },
});

export default PollDetailsScreen;