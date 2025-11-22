import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const JoinTeamScreen = ({ navigation }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinTeam = async () => {
    Keyboard.dismiss();
    const codeToJoin = inviteCode.trim().toUpperCase();

    // 1. --- Validación Inicial ---
    if (codeToJoin === '') {
      Alert.alert('Campo Requerido', 'Por favor, introduce un código de invitación.');
      return;
    }

    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error de Autenticación', 'Debes haber iniciado sesión para unirte a un equipo.');
      return;
    }

    setLoading(true);
    console.log(`--- INICIANDO PROCESO "JOIN TEAM" ---`);
    console.log(`Usuario: ${currentUser.uid}`);
    console.log(`Código de invitación: ${codeToJoin}`);

    try {
      // 2. --- Buscar el Código de Invitación ---
      console.log('Paso 1: Buscando el código en la base de datos...');
      const rosterQuery = firestore()
        .collectionGroup('roster')
        .where('inviteCode', '==', codeToJoin)
        .limit(1);

      const rosterQuerySnapshot = await rosterQuery.get();

      if (rosterQuerySnapshot.empty) {
        console.warn('Búsqueda finalizada: El código de invitación no fue encontrado.');
        Alert.alert('Código no Válido', 'No se encontró ningún equipo con ese código. Por favor, revísalo e intenta de nuevo.');
        setLoading(false); // Detenemos aquí ya que no es un error del servidor
        return;
      }
      
      const playerProfileDoc = rosterQuerySnapshot.docs[0];
      console.log(`Paso 1 Exitoso: Documento encontrado en la ruta: ${playerProfileDoc.ref.path}`);

      // 3. --- Validar si el Código ya fue Usado ---
      console.log('Paso 2: Validando si el código ya ha sido reclamado...');
      const playerProfileData = playerProfileDoc.data();
      if (playerProfileData.status === 'claimed' || playerProfileData.userId) {
        console.warn('Validación fallida: El código ya fue utilizado.');
        Alert.alert('Código Usado', 'Este código de invitación ya ha sido reclamado por otro usuario.');
        setLoading(false); // Detenemos aquí
        return;
      }
      console.log('Paso 2 Exitoso: El código es válido y no ha sido reclamado.');

      // 4. --- Preparar y Ejecutar la Transacción ---
      console.log('Paso 3: Preparando la transacción en lote...');
      const teamId = playerProfileDoc.ref.parent.parent.id;
      const userRef = firestore().collection('users').doc(currentUser.uid);
      const playerProfileRef = playerProfileDoc.ref;

      const batch = firestore().batch();

      // Operación 1: Actualizar el perfil del jugador en el roster
      batch.update(playerProfileRef, {
        status: 'claimed',
        userId: currentUser.uid,
        inviteCode: firestore.FieldValue.delete(), // Mejor que null para las reglas
      });

      // Operación 2: Actualizar el documento del usuario
      batch.update(userRef, {
        role: 'player',
        teams: firestore.FieldValue.arrayUnion(teamId),
      });
      
      console.log(`Lote preparado. Actualizando:\n- Roster: ${playerProfileRef.path}\n- Usuario: ${userRef.path}`);
      
      console.log('Paso 4: Ejecutando la transacción...');
      await batch.commit();
      console.log('--- PROCESO "JOIN TEAM" COMPLETADO EXITOSAMENTE ---');

      Alert.alert(
        '¡Éxito!',
        `Te has unido al equipo exitosamente.`,
      );
      navigation.goBack(); // O a donde quieras redirigir al usuario

    } catch (error) {
      console.error('--- ¡ERROR! EL PROCESO "JOIN TEAM" FALLÓ ---');
      console.error('Código de invitación que falló:', codeToJoin);
      console.error('Usuario que falló:', currentUser.uid);
      console.error('Código de Error de Firebase:', error.code);
      console.error('Mensaje de Error de Firebase:', error.message);
      console.error('Stack del Error:', error.stack);

      Alert.alert(
        `Error (${error.code || 'Desconocido'})`,
        `Ocurrió un error inesperado al intentar unirte al equipo.\n\n${error.message}`
      );
    } finally {
      // 5. --- Limpieza Final ---
      // Este bloque se ejecuta siempre, tanto si hay éxito como si hay error.
      setLoading(false);
      console.log('--- FIN DEL PROCESO ---');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join a Team</Text>
        <Text style={styles.subtitle}>Enter the invite code your manager gave you.</Text>

        <TextInput
          style={styles.input}
          placeholder="XXXX-XXXX"
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="characters"
          maxLength={9}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <Button title="Join Team" onPress={handleJoinTeam} disabled={loading} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f7fa', },
    content: { flex: 1, justifyContent: 'center', padding: 24, },
    title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8, },
    subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, textAlign: 'center', fontWeight: 'bold', letterSpacing: 2, marginBottom: 24, },
});

export default JoinTeamScreen;