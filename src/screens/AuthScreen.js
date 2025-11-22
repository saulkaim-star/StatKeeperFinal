import auth from '@react-native-firebase/auth';
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

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); 

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    
    setLoading(true); 

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'The email address is invalid!';
      }
      Alert.alert('Login Error', errorMessage);
      console.error(error);
    } finally {
      setLoading(false); 
    }
  };

  const handleNavigateToRegister = () => { navigation.navigate('Register'); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{marginVertical: 10}} />
        ) : (
          <View style={styles.buttonContainer}>
            <Button title="Sign In" onPress={handleLogin} />
          </View>
        )}

        <TouchableOpacity style={styles.registerButton} onPress={handleNavigateToRegister}>
          <Text style={styles.registerButtonText}>
            Don't have an account? <Text style={{fontWeight: 'bold'}}>Register here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 16 },
  buttonContainer: { marginBottom: 24 },
  registerButton: { marginTop: 24, alignItems: 'center' },
  registerButtonText: { fontSize: 14, color: '#3b82f6' },
});

export default AuthScreen;