import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true); 

    try {
      // 1. Crear el usuario en Firebase Auth
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      console.log('User account created in Auth!');

      const user = userCredential.user;

      if (user) {
        
        // --- INICIO DE LA CORRECCIÓN (LÓGICA) ---

        // 2. Enviar el email de verificación
        await user.sendEmailVerification();
        
        // 3. Crear el documento en Firestore
        // Esto se 'await' para asegurar que se envía a la cola local
        await firestore().collection('users').doc(user.uid).set({
          email: user.email,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        console.log('User document created in Firestore!');

        // 4. Avisar al usuario Y ESPERAR A QUE PRESIONE "OK"
        Alert.alert(
          "Check Your Email", 
          "We've sent a verification link to your email address. Please verify your account and then log in.", 
          [{ 
            text: "OK",
            // 5. CERRAR SESIÓN Y NAVEGAR SOLO DESPUÉS DE QUE EL USUARIO CONFIRME
            // Esto da tiempo a que la escritura de Firestore se sincronice
            onPress: async () => {
              await auth().signOut();
              navigation.navigate('Auth');
            }
          }]
        );

        // (Se eliminan el signOut y la navegación de aquí)

        // --- FIN DE LA CORRECCIÓN (LÓGICA) ---
      }

    } catch (authError) {
      if (authError.code === 'auth/email-already-in-use') {
        Alert.alert('Registration Error', 'That email address is already in use!');
      } else if (authError.code === 'auth/invalid-email') {
        Alert.alert('Registration Error', 'That email address is invalid!');
      } else {
        Alert.alert('Registration Error', authError.message);
      }
      console.error(authError);
    } finally {
      setLoading(false); // <-- Terminamos de cargar
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Get started with your team</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min. 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          // --- INICIO DE LA CORRECCIÓN (VISUAL) ---
          textContentType="password"
          autoComplete="password"
          // --- FIN DE LA CORRECCIÓN (VISUAL) ---
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          // --- INICIO DE LA CORRECCIÓN (VISUAL) ---
          textContentType="password"
          autoComplete="password"
          // --- FIN DE LA CORRECCIÓN (VISUAL) ---
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : (
          <Button title="Create Account" onPress={handleRegister} />
        )}

        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Auth')}>
          <Text style={styles.loginButtonText}>
            Already have an account? <Text style={{fontWeight: 'bold'}}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... (tus estilos son los mismos)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  loginButton: { marginTop: 24, alignItems: 'center' },
  loginButtonText: { fontSize: 14, color: '#3b82f6' },
});

export default RegisterScreen;