import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity, // Asegúrate que esté importado
  StyleSheet,
  Alert,
  Button,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const RoleSelectScreen = ({ navigation }) => {
  // Función genérica para actualizar el rol y navegar
  const updateUserRole = (role, nextScreen) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user is currently signed in.");
      return;
    }
    firestore().collection('users').doc(currentUser.uid).update({ role })
      .then(() => {
        console.log(`User role updated to: ${role}`);
        // Navegar a la pantalla específica del flujo de onboarding si se proporciona
        if (nextScreen) {
          navigation.navigate(nextScreen);
        }
        // Si no hay nextScreen (como en el caso inicial de 'manager'),
        // App.tsx se encargará de redirigir al stack correcto (ManagerRoot o CreateTeam)
        // basado en si el usuario ya tiene un equipo o no.
      })
      .catch(err => {
        console.error(`Error setting role to ${role}:`, err);
        Alert.alert("Error", "Could not set user role.");
      });
  };

  // Llama a updateUserRole con el rol y la siguiente pantalla del onboarding
  const handleSelectManager = () => updateUserRole('manager', 'CreateTeam');
  const handleSelectPlayer = () => updateUserRole('player', 'JoinTeam');
  const handleSelectOrganizer = () => updateUserRole('Organización', 'CreateCompetition');

  const handleLogout = () => {
    auth().signOut();
    // No necesitamos navegar aquí, App.tsx detectará el cambio de auth y mostrará AuthStack
  };

  return (
    // Asegúrate que toda la estructura JSX esté presente
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>How will you use the app?</Text>

        {/* Opción Manager */}
        <TouchableOpacity style={styles.optionButton} onPress={handleSelectManager}>
          <Text style={styles.optionTitle}>🏟️ Create a Team</Text>
          <Text style={styles.optionDescription}>
            For managers who want to record stats and manage their roster.
          </Text>
        </TouchableOpacity>

        {/* Opción Player */}
        <TouchableOpacity style={styles.optionButton} onPress={handleSelectPlayer}>
          <Text style={styles.optionTitle}>🎟️ Join a Team</Text>
          <Text style={styles.optionDescription}>
            For players who have an invite code and want to see their stats.
          </Text>
        </TouchableOpacity>

        {/* Opción Organizer */}
        <TouchableOpacity style={styles.optionButton} onPress={handleSelectOrganizer}>
          <Text style={styles.optionTitle}>🏆 Organize a Competition</Text>
          <Text style={styles.optionDescription}>
            For leagues that want to create schedules and manage teams.
          </Text>
        </TouchableOpacity>

        {/* Botón Log Out */}
        <View style={styles.logoutContainer}>
          <Button title="Log Out" onPress={handleLogout} color="#888" />
        </View>
      </View>
    </SafeAreaView>
  );
};

// --- Estilos COMPLETOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center', // Centrar verticalmente
  },
  content: {
    padding: 24, // Espaciado alrededor del contenido
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937', // Color oscuro casi negro
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280', // Color gris medio
    textAlign: 'center',
    marginBottom: 40, // Más espacio antes de los botones
  },
  optionButton: {
    backgroundColor: 'white', // Fondo blanco
    padding: 20, // Espaciado interno
    borderRadius: 12, // Bordes redondeados
    borderWidth: 1, // Borde sutil
    borderColor: '#e5e7eb', // Color del borde gris claro
    marginBottom: 20, // Espacio entre botones
    alignItems: 'center', // Centrar texto horizontalmente
    // Sombra (opcional, para Android)
    elevation: 2,
    // Sombra (opcional, para iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6', // Color azul
    marginBottom: 8, // Espacio debajo del título
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280', // Color gris medio
    textAlign: 'center', // Centrar descripción
  },
  logoutContainer: {
    marginTop: 30, // Espacio arriba del botón Log Out
  }
});

export default RoleSelectScreen;