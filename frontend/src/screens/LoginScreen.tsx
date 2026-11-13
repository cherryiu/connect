import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginForm from '../components/forms/LoginForm';
import CreateNewUserForm from '../components/forms/CreateNewUserForm';
import { ImageBackground, StyleSheet, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS } from '../constants';
import gradientBackground from '../../assets/gradient-background-login.jpg';
import { APP_ENV } from '@env';
import { useAuth } from '../context/AuthContext';

type LoginNavigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginNavigation>();
  const { isLoggedIn, login } = useAuth();
  const [mode, setMode] = useState<'login' | 'create'>('login');
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    if (isLoggedIn) navigation.replace('ScrapbookCalendarScreen');
  }, [isLoggedIn, navigation]);

  // mocking for test purposes
  const openDevCalendar = async () => {
    if (APP_ENV === 'mock' && !isLoggedIn) {
      await login('mock@coze.local', 'password');
      return;
    }
    navigation.navigate('ScrapbookCalendarScreen');
  };

  return (
    <ImageBackground
      resizeMode="cover"
      source={gradientBackground}
      style={styles.background}
      testID="login-screen"
    >
      <SafeAreaView style={styles.safeArea}>
        {mode === 'login' ? (
          <LoginForm
            initialEmail={registeredEmail}
            onCreateAccount={() => {
              setRegisteredEmail('');
              setMode('create');
            }}
            successMessage={registeredEmail ? 'Account created. You can log in now.' : undefined}
          />
        ) : (
          <CreateNewUserForm
            onBackToLogin={() => setMode('login')}
            onCreated={(email) => {
              setRegisteredEmail(email);
              setMode('login');
            }}
          />
        )}

        {/* for testing purposes */}
        <Pressable
          onPress={() => void openDevCalendar()}
          style={{ padding: 12, backgroundColor: COLORS.primary, margin: 12, borderRadius: 6 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Go to Scrapbook Screen</Text>
        </Pressable>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
});
