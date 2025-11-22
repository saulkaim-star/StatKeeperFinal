import React, { useLayoutEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

const PollItem = ({ item, onDelete, isPlayerView }) => {
  const navigation = useNavigation();
  const totalVotes = Object.keys(item.votes || {}).length;

  return (
    <TouchableOpacity 
      style={styles.pollItemContainer}
      onPress={() => navigation.navigate('PollDetails', { pollId: item.id, teamId: item.teamId })}
    >
        <View style={styles.pollItemHeader}>
            <Text style={styles.pollItemText}>{item.question}</Text>
            {!isPlayerView && (
                <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
            )}
        </View>
      <Text style={styles.pollItemVotes}>{totalVotes} vote(s)</Text>
    </TouchableOpacity>
  );
};

const PollsScreen = ({ route }) => {
  const { teamId, isPlayerView } = route.params || {};
  const navigation = useNavigation();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (!isPlayerView) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={() => navigation.navigate('CreatePoll', { teamId })} style={{ marginRight: 10 }}>
            <Text style={{ color: '#3b82f6', fontSize: 30 }}>+</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, teamId, isPlayerView]);

  useFocusEffect(
    useCallback(() => {
      if (!teamId) {
          setLoading(false);
          return;
      }
      setLoading(true);
      const subscriber = firestore()
        .collection('teams').doc(teamId).collection('polls')
        .orderBy('createdAt', 'desc')
        .onSnapshot(querySnapshot => {
          const list = [];
          if (querySnapshot) {
            querySnapshot.forEach(doc => list.push({ id: doc.id, teamId, ...doc.data() }));
          }
          setPolls(list);
          setLoading(false);
        }, error => {
          console.error("Error fetching polls:", error);
          setLoading(false);
        });
      return () => subscriber();
    }, [teamId])
  );

  // --- FUNCIÓN DE BORRADO (CORREGIDA) ---
  const handleDeletePoll = (pollId) => {
    Alert.alert(
      "Delete Poll",
      "Are you sure you want to delete this poll?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // 1. Actualización optimista: lo borramos de la vista inmediatamente
            const newPolls = polls.filter(poll => poll.id !== pollId);
            setPolls(newPolls);

            // 2. Luego, enviamos la orden de borrar a la base de datos
            firestore()
              .collection('teams').doc(teamId)
              .collection('polls').doc(pollId)
              .delete()
              .catch(error => {
                console.error("Error deleting poll: ", error);
                Alert.alert("Error", "Could not delete the poll.");
                // Si hay un error, podríamos volver a cargar los datos para restaurar la encuesta
              });
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={polls}
        renderItem={({ item }) => (
            <PollItem 
                item={item}
                isPlayerView={isPlayerView}
                onDelete={() => handleDeletePoll(item.id)}
            />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No polls have been created yet.</Text>}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pollItemContainer: { backgroundColor: 'white', padding: 20, marginVertical: 8, marginHorizontal: 16, borderRadius: 12, elevation: 2, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  pollItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  pollItemText: { fontSize: 18, fontWeight: '600', color: '#1f2937', flex: 1, marginRight: 10 },
  pollItemVotes: { fontSize: 14, color: 'gray', marginTop: 8 },
  deleteButton: { paddingHorizontal: 5, paddingVertical: 2 },
  deleteButtonText: { color: 'red', fontSize: 20, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray', fontSize: 16 },
});

export default PollsScreen;