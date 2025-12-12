import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SpInAppUpdates, { IAUUpdateKind } from 'sp-react-native-in-app-updates'; // <--- Importar librería 

// --- Importaciones de Pantallas (Tus importaciones originales) ---
import AnnouncementsScreen from './src/screens/AnnouncementsScreen';
import AuthScreen from './src/screens/AuthScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import CompetitionCalendarScreen from './src/screens/CompetitionCalendarScreen';
import CreateAnnouncementScreen from './src/screens/CreateAnnouncementScreen';
import CreateCompetitionGameScreen from './src/screens/CreateCompetitionGameScreen';
import CreateCompetitionScreen from './src/screens/CreateCompetitionScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import CreateMediaPostScreen from './src/screens/CreateMediaPostScreen';
import CreatePollScreen from './src/screens/CreatePollScreen';
import CreateTeamScreen from './src/screens/CreateTeamScreen';
import EditGameScreen from './src/screens/EditGameScreen';
import EditPlayerProfileScreen from './src/screens/EditPlayerProfileScreen';
import EventDetailsScreen from './src/screens/EventDetailsScreen';
import HubScreen from './src/screens/HubScreen';
import InProgressGameScreen from './src/screens/InProgressGameScreen';
import JoinCompetitionScreen from './src/screens/JoinCompetitionScreen';
import JoinTeamScreen from './src/screens/JoinTeamScreen';
import OrganizerDashboardScreen from './src/screens/OrganizerDashboardScreen';
import PlayerHomeScreen from './src/screens/PlayerHomeScreen';
import PollDetailsScreen from './src/screens/PollDetailsScreen';
import PollsScreen from './src/screens/PollsScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ResolveGameScreen from './src/screens/ResolveGameScreen';
import RoleSelectScreen from './src/screens/RoleSelectScreen';
import RosterScreen from './src/screens/RosterScreen';
import SelectLineupScreen from './src/screens/SelectLineupScreen';
import StartGameScreen from './src/screens/StartGameScreen';
import StatsScreen from './src/screens/StatsScreen';
import TeamHubScreen from './src/screens/TeamHubScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- AuthStack y OnboardingStack (Sin cambios) ---
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
  </Stack.Navigator>
);

const OnboardingStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: 'Choose Your Role', headerBackVisible: false }} />
    <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: 'Create New Team' }} />
    <Stack.Screen name="JoinTeam" component={JoinTeamScreen} options={{ title: 'Join a Team' }} />
    <Stack.Screen name="CreateCompetition" component={CreateCompetitionScreen} options={{ title: 'New Competition' }} />
  </Stack.Navigator>
);

// --- NAVEGACIÓN DEL MÁNAGER (Sin cambios) ---
const ManagerTabNavigator = () => {
  const [teamInfo, setTeamInfo] = useState({ id: null, name: null, loading: true });
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) { setTeamInfo({ id: null, name: 'Auth Error', loading: false }); return; }
    const subscriber = firestore().collection('teams').where('managerId', '==', currentUser.uid).limit(1)
      .onSnapshot(querySnapshot => {
        if (querySnapshot && !querySnapshot.empty) {
          const teamDoc = querySnapshot.docs[0];
          setTeamInfo({ id: teamDoc.id, name: teamDoc.data().teamName, loading: false });
        } else {
          setTeamInfo({ id: null, name: 'No Team Found', loading: false });
        }
      }, error => {
        console.error("Error fetching manager's team:", error);
        setTeamInfo({ id: null, name: 'Error Loading', loading: false });
      });
    return () => subscriber();
  }, []);

  if (teamInfo.loading) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>; }
  if (!teamInfo.id) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Error: Team information not available.</Text></View>; }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Stats') iconName = '📊';
          else if (route.name === 'Team Hub') iconName = '🏠';
          else if (route.name === 'Roster') iconName = '👥';
          else if (route.name === 'New Game') iconName = '⚾';
          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#3b82f6', tabBarInactiveTintColor: 'gray',
      })} >
      <Tab.Screen name="Stats" component={StatsScreen} options={{ title: 'Stats & History' }} initialParams={{ teamId: teamInfo.id, teamName: teamInfo.name, isPlayerView: false }} />
      <Tab.Screen name="Team Hub" component={TeamHubScreen} initialParams={{ teamId: teamInfo.id, teamName: teamInfo.name }} />
      <Tab.Screen name="Roster" component={RosterScreen} initialParams={{ teamId: teamInfo.id }} />
      <Tab.Screen name="New Game" component={StartGameScreen} initialParams={{ teamId: teamInfo.id }} />
    </Tab.Navigator>
  );
};

// --- ManagerStack (Sin cambios) ---
const ManagerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="ManagerTabs" component={ManagerTabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="JoinCompetition" component={JoinCompetitionScreen} options={{ title: 'Join a Competition', headerShown: true }} />
    <Stack.Screen name="SelectLineup" component={SelectLineupScreen} options={{ title: 'Select Batting Order' }} />
    <Stack.Screen
      name="InProgressGame"
      component={InProgressGameScreen}
      options={{
        title: 'Game In Progress',
        headerShown: false,
        keepAwake: true
      }}
    />
    <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
    <Stack.Screen name="CreateAnnouncement" component={CreateAnnouncementScreen} options={{ title: 'New Announcement' }} />
    <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Team Calendar' }} />
    <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'New Event' }} />
    <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details' }} />
    <Stack.Screen name="Polls" component={PollsScreen} options={{ title: 'Polls' }} />
    <Stack.Screen name="CreatePoll" component={CreatePollScreen} options={{ title: 'New Poll' }} />
    <Stack.Screen name="PollDetails" component={PollDetailsScreen} options={{ title: 'Poll Results' }} />
    <Stack.Screen name="CreateMediaPost" component={CreateMediaPostScreen} options={{ title: 'Create Post' }} />
  </Stack.Navigator>
);

// --- NAVEGACIÓN DEL JUGADOR (Sin cambios) ---
const PlayerTabNavigator = () => {
  const [teamInfo, setTeamInfo] = useState({ teamId: null, loading: true, error: null });
  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        const currentUser = auth().currentUser;
        if (!currentUser) throw new Error("Authentication error.");
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          let foundTeamId = (userData.teams && userData.teams.length > 0) ? userData.teams[0] : userData.teamId;
          if (foundTeamId) { setTeamInfo({ teamId: foundTeamId, loading: false, error: null }); }
          else { throw new Error("Could not find team information on user profile."); }
        } else { throw new Error("User profile does not exist."); }
      } catch (e) { console.error("Error fetching player team info:", e); setTeamInfo({ teamId: null, loading: false, error: e.message }); }
    };
    fetchUserTeam();
  }, []);

  if (teamInfo.loading) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>; }
  if (teamInfo.error || !teamInfo.teamId) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'red', padding: 20 }}>{teamInfo.error || 'Team ID not found.'}</Text></View>; }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Profile') iconName = '👤';
          else if (route.name === 'Team') iconName = '📊';
          else if (route.name === 'Calendar') iconName = '📅';
          else if (route.name === 'Hub') iconName = '🏠';
          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#3b82f6', tabBarInactiveTintColor: 'gray',
      })} >
      <Tab.Screen name="Profile" component={PlayerHomeScreen} options={{ title: 'My Profile' }} />
      <Tab.Screen name="Team" component={StatsScreen} options={{ title: 'My Team' }} initialParams={{ teamId: teamInfo.teamId, isPlayerView: true }} />
      <Tab.Screen name="Calendar" component={CalendarScreen} initialParams={{ teamId: teamInfo.teamId, isPlayerView: true }} />
      <Tab.Screen name="Hub" component={HubScreen} initialParams={{ teamId: teamInfo.teamId, isPlayerView: true }} />
    </Tab.Navigator>
  );
};

// --- PlayerStack (Sin cambios, ya corregido) ---
const PlayerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="PlayerTabs" component={PlayerTabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
    <Stack.Screen name="Polls" component={PollsScreen} options={{ title: 'Polls' }} />
    <Stack.Screen
      name="EditPlayerProfile"
      component={EditPlayerProfileScreen}
      options={{ title: 'Edit Profile' }}
    />
    <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details' }} />
    <Stack.Screen name="PollDetails" component={PollDetailsScreen} options={{ title: 'Poll Results' }} />
    <Stack.Screen name="CreateMediaPost" component={CreateMediaPostScreen} options={{ title: 'Create Post' }} />
  </Stack.Navigator>
);

// --- NAVEGACIÓN DEL ORGANIZADOR (Sin cambios) ---
const OrganizerTabNavigator = () => {
  const [competitionId, setCompetitionId] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) { setLoading(false); return; }
    const subscriber = firestore().collection('users').doc(currentUser.uid)
      .onSnapshot(doc => {
        if (doc.exists && doc.data().competitionId) {
          const compId = doc.data().competitionId;
          setCompetitionId(compId);
        } else { console.error("OrganizerTabNavigator: competitionId NOT FOUND on user profile."); }
        setLoading(false);
      }, error => { console.error("Error fetching organizer competitionId:", error); setLoading(false); });
    return () => subscriber();
  }, []);

  if (loading) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>; }
  if (!competitionId) { return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Error: Competition ID not found for organizer.</Text></View>; }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = '🏆';
          else if (route.name === 'Schedule') iconName = '📅';
          return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
        },
        tabBarActiveTintColor: '#3b82f6', tabBarInactiveTintColor: 'gray',
      })} >
      <Tab.Screen name="Dashboard" component={OrganizerDashboardScreen} options={{ title: 'Competition Info' }} initialParams={{ competitionId: competitionId }} />
      <Tab.Screen name="Schedule" component={CompetitionCalendarScreen} options={{ title: 'Game Schedule' }} initialParams={{ competitionId: competitionId }} />
    </Tab.Navigator>
  );
};

const OrganizerStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="OrganizerTabs" component={OrganizerTabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="CreateCompetitionGame" component={CreateCompetitionGameScreen} options={{ title: 'Schedule New Game', headerShown: true }} />
    <Stack.Screen name="ResolveGame" component={ResolveGameScreen} options={{ title: 'Resolve Game Result', headerShown: true }} />
    <Stack.Screen name="EditGame" component={EditGameScreen} options={{ title: 'Edit Game Schedule', headerShown: true }} />
  </Stack.Navigator>
);

const CreateCompetitionStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="CreateCompetition" component={CreateCompetitionScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

// --- LoadingScreen (Sin cambios) ---
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa' }}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={{ marginTop: 10, color: '#6b7f0' }}>Loading...</Text>
  </View>
);

// --- Componente Principal App (¡CORREGIDO!) ---
function App() {
  const [userState, setUserState] = useState({ isLoading: true, user: null, profile: null });

  // --- useEffect de Autenticación (¡MODIFICADO!) ---
  useEffect(() => {
    // 0. --- VERIFICACIÓN DE ACTUALIZACIONES (NUEVO) ---
    const checkForUpdates = async () => {
      const inAppUpdates = new SpInAppUpdates(
        false // isDebug (ponlo en true si quieres probar en debug, pero suele requerir build real)
      );

      try {
        const result = await inAppUpdates.checkNeedsUpdate();

        if (result.shouldUpdate) {
          console.log("App.tsx: Update available!");
          // Opciones: IAUUpdateKind.FLEXIBLE (segundo plano) o IAUUpdateKind.IMMEDIATE (bloqueante)
          // Para asegurar que todos tengan la última versión, usamos IMMEDIATE.
          await inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.IMMEDIATE,
          });
        } else {
          console.log("App.tsx: App is up to date.");
        }
      } catch (error) {
        // En desarrollo es normal que falle si no está firmada con la key de la tienda.
        console.log("App.tsx: Update check skipped or failed (expected in dev):", error);
      }
    };

    checkForUpdates();

    let firestoreSubscriber = () => { };

    const authSubscriber = auth().onAuthStateChanged(async (authUser) => {

      // 1. Detenemos el oyente de perfil anterior ANTES de hacer nada más.
      firestoreSubscriber();

      if (authUser) {

        try {
          // 2. Recargamos el estado del usuario (para verificar email, etc.)
          await authUser.reload();

          // 3. Volvemos a obtener el usuario (más seguro después de reload)
          const currentUser = auth().currentUser;

          // Si el usuario desapareció (ej. borrado), salimos
          if (!currentUser) {
            setUserState({ isLoading: false, user: null, profile: null });
            return;
          }

          if (!currentUser.emailVerified) {
            Alert.alert(
              "Verification Required",
              "You must verify your email address before logging in. Please check your inbox.\n\n(Click 'Resend' to send a new link.)",
              [
                { text: "OK", onPress: () => auth().signOut() },
                {
                  text: "Resend",
                  onPress: async () => {
                    try {
                      await currentUser.sendEmailVerification();
                      Alert.alert("Link Sent", "A new verification link has been sent to your email.");
                    } catch (e) {
                      Alert.alert("Error", "Could not send verification link. Please try again later.");
                    }
                    await auth().signOut();
                  }
                }
              ],
              { cancelable: false }
            );

            setUserState({ isLoading: false, user: null, profile: null });
            return;
          }

          // 4. Si todo está bien, escuchamos el perfil del usuario
          firestoreSubscriber = firestore().collection('users').doc(currentUser.uid)
            .onSnapshot(
              documentSnapshot => {
                if (documentSnapshot && documentSnapshot.exists) {
                  setUserState({ isLoading: false, user: currentUser, profile: documentSnapshot.data() });
                }
                else {
                  setUserState({ isLoading: false, user: currentUser, profile: null });
                }
              },
              error => {
                // --- ¡CORRECCIÓN CLAVE! ---
                // Si el error es 'permission-denied', es porque el usuario está
                // cerrando sesión. NO mostramos una alerta.
                if (error.code === 'permission-denied') {
                  console.warn("App.tsx: Firestore listener detached (permission-denied, likely during logout).");
                } else {
                  // Este SÍ es un error real
                  console.error("App.tsx: Firestore listener error:", error.code, error.message);
                  Alert.alert("Error", "Could not load your user profile. Please log in again.");
                  auth().signOut();
                }
                setUserState({ isLoading: false, user: null, profile: null });
              }
            );

        } catch (reloadError) {
          // Si reload() falla (ej. usuario borrado), cerramos sesión.
          console.warn("App.tsx: Failed to reload user.", reloadError.code);
          auth().signOut();
          setUserState({ isLoading: false, user: null, profile: null });
          return;
        }

      } else {
        // 5. El usuario cerró sesión.
        setUserState({ isLoading: false, user: null, profile: null });
      }
    });

    // 6. Limpieza final
    return () => {
      authSubscriber();
      firestoreSubscriber();
    };
  }, []);
  // --- Fin del useEffect de Autenticación ---


  if (userState.isLoading) { return <LoadingScreen />; }

  // --- Lógica de Renderizado de Stacks (¡Corregido el error de dedo!) ---
  let stackToRender;
  if (userState.user) {
    if (userState.profile && userState.profile.role) {
      switch (userState.profile.role) {
        case 'manager':
          // (Corregido el error de dedo 'userS0tate')
          if (userState.profile.teams?.length > 0) { stackToRender = <Stack.Screen name="ManagerRoot" component={ManagerStack} />; }
          else { stackToRender = <Stack.Screen name="OnboardingRoot" component={OnboardingStack} initialParams={{ screen: 'CreateTeam' }} />; }
          break;
        case 'Organización':
          if (userState.profile.competitionId) { stackToRender = <Stack.Screen name="OrganizerRoot" component={OrganizerStack} />; }
          else { stackToRender = <Stack.Screen name="CreateCompetitionRoot" component={CreateCompetitionStack} />; }
          break;
        case 'player':
          const hasTeam = userState.profile.teams?.length > 0 || userState.profile.teamId;
          if (hasTeam) { stackToRender = <Stack.Screen name="PlayerRoot" component={PlayerStack} />; }
          else { stackToRender = <Stack.Screen name="OnboardingRoot" component={OnboardingStack} initialParams={{ screen: 'JoinTeam' }} />; }
          break;
        default:
          stackToRender = <Stack.Screen name="OnboardingRoot" component={OnboardingStack} initialParams={{ screen: 'RoleSelect' }} />; break;
      }
    } else {
      stackToRender = <Stack.Screen name="OnboardingRoot" component={OnboardingStack} initialParams={{ screen: 'RoleSelect' }} />;
    }
  } else {
    stackToRender = <Stack.Screen name="AuthRoot" component={AuthStack} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {stackToRender}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;