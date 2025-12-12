import firestore from '@react-native-firebase/firestore';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnnouncementItem = ({ item, onDelete, isPlayerView }) => (
  <View style={styles.itemContainer}>
    <Text style={styles.itemText}>{item.text}</Text>
    <View style={styles.footer}>
      <Text style={styles.itemDate}>{item.createdAt?.toDate().toLocaleDateString()}</Text>
      {/* El botón de borrar solo se muestra si NO es la vista del jugador */}
      {!isPlayerView && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const AnnouncementsScreen = ({ route, navigation }) => {
  const { teamId, isPlayerView } = route.params || {};
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (!isPlayerView) {
      navigation.setOptions({
        headerRight: () => (
          <Button onPress={() => navigation.navigate('CreateAnnouncement', { teamId })} title="+" />
        ),
      });
    }
  }, [navigation, teamId, isPlayerView]);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    const subscriber = firestore()
      .collection('teams').doc(teamId).collection('announcements')
      .orderBy('createdAt', 'desc')
      .onSnapshot(querySnapshot => {
        const list = [];
        if (querySnapshot) {
          querySnapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        }
        setAnnouncements(list);
        setLoading(false);
      });
    return () => subscriber();
  }, [teamId]);

  const handleDeleteAnnouncement = (announcementId) => {
    Alert.alert(
      "Delete Announcement",
      "Are you sure you want to delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            firestore()
              .collection('teams').doc(teamId)
              .collection('announcements').doc(announcementId)
              .delete()
              .catch(error => {
                console.error("Error deleting announcement: ", error);
                Alert.alert("Error", "Could not delete the announcement.");
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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={announcements}
        renderItem={({ item }) => (
          <AnnouncementItem
            item={item}
            isPlayerView={isPlayerView}
            onDelete={() => handleDeleteAnnouncement(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No announcements yet.</Text>}
        contentContainerStyle={{ paddingTop: 10 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemContainer: { backgroundColor: 'white', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 8, elevation: 1 },
  itemText: { fontSize: 16, marginBottom: 15, color: '#1f2937' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDate: { fontSize: 12, color: 'gray' },
  deleteButton: { paddingHorizontal: 10, paddingVertical: 5 },
  deleteButtonText: { color: 'red', fontSize: 16, fontWeight: '500' },
  emptyText: { textAlign: 'center', marginTop: 50, color: 'gray' },
});

export default AnnouncementsScreen;