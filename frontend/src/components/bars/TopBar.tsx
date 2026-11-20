import { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IMAGES, FONTS } from '../../constants';
import { useTheme, type AppColors } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/RootNavigator';

type TopBarProps = {
  avatarUrl?: string | null;
  onLogout: () => Promise<void>;
};

type MenuNavigation = NativeStackNavigationProp<RootStackParamList, 'ViewProfileScreen'>;

export default function TopBar({ avatarUrl, onLogout }: TopBarProps) {
  const navigation = useNavigation<MenuNavigation>();
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setLoggingOut(true);
      await onLogout();
      setSidebarOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const openProfileScreen = () => {
    navigation.navigate('ViewProfileScreen');
  };

  const openSettings = () => {
    setSidebarOpen(false);
    Alert.alert('App settings', 'Settings controls will be added here next.');
  };

  return (
    <View style={styles.topBar}>
      <Text style={styles.brand}>COZE</Text>
      <View style={styles.rightActions}>
        <Pressable
          accessibilityLabel="Open app menu"
          accessibilityRole="button"
          accessibilityState={{ expanded: sidebarOpen }}
          hitSlop={10}
          onPress={() => setSidebarOpen(true)}
          style={({ pressed }) => [styles.dotsButton, pressed && styles.pressed]}
        >
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Pressable>
        <Pressable
          accessibilityLabel="View profile"
          accessibilityRole="button"
          hitSlop={8}
          onPress={openProfileScreen}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Image source={{ uri: avatarUrl || IMAGES.avatar }} style={styles.avatar} />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => setSidebarOpen(false)}
        transparent
        visible={sidebarOpen}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close app menu"
            onPress={() => setSidebarOpen(false)}
            style={styles.backdrop}
          />

          <SafeAreaView style={styles.sidebar}>
            <View style={styles.sidebarHeading}>
              <View style={styles.sidebarBrandRow}>
                <Text style={styles.sidebarBrand}>COZE</Text>
              </View>
              <Pressable
                accessibilityLabel="Close app menu"
                hitSlop={10}
                onPress={() => setSidebarOpen(false)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.sidebarLabel}>OPTIONS</Text>
            <Pressable
              accessibilityRole="button"
              onPress={openSettings}
              style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            >
              <Text style={styles.menuItemIcon}>⚙</Text>
              <Text style={styles.menuItemText}>APP SETTINGS</Text>
              <Text style={styles.menuItemArrow}>→</Text>
            </Pressable>
            <View style={styles.menuItem}>
              <Text style={styles.menuItemIcon}>☾</Text>
              <Text style={styles.menuItemText}>DARK MODE</Text>
              <Switch
                accessibilityLabel="Dark mode"
                onValueChange={setDarkMode}
                thumbColor={isDarkMode ? colors.surface : '#fffaf5'}
                trackColor={{ false: '#cfc6bd', true: colors.teal }}
                value={isDarkMode}
              />
            </View>

            <View style={styles.sidebarSpacer} />
            <Pressable
              accessibilityRole="button"
              disabled={loggingOut}
              onPress={() => void logout()}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.menuItemPressed]}
            >
              {loggingOut ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={styles.logoutText}>LOG OUT</Text>
              )}
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    topBar: {
      alignItems: 'center',
      backgroundColor: colors.background,
      flexDirection: 'row',
      height: 64,
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      zIndex: 20,
    },
    rightActions: { alignItems: 'center', flexDirection: 'row' },
    dotsButton: {
      alignItems: 'center',
      flexDirection: 'row',
      height: 38,
      justifyContent: 'center',
      marginRight: 8,
      width: 30,
    },
    dot: {
      backgroundColor: colors.primary,
      borderRadius: 2.5,
      height: 5,
      marginHorizontal: 1.5,
      width: 5,
    },
    brand: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 24,
      letterSpacing: -0.4,
    },
    avatar: {
      borderColor: colors.tealDark,
      borderWidth: 1.5,
      height: 40,
      width: 40,
      borderRadius: 20,
    },
    pressed: { opacity: 0.55 },
    modalRoot: { flex: 1, flexDirection: 'row' },
    sidebar: {
      backgroundColor: colors.background,
      borderLeftColor: colors.teal,
      borderLeftWidth: 1.5,
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { height: 0, width: -5 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      width: '78%',
      zIndex: 2,
    },
    backdrop: { backgroundColor: 'rgba(10,8,7,0.48)', flex: 1 },
    sidebarHeading: {
      alignItems: 'center',
      borderBottomColor: 'rgba(132,165,157,0.32)',
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      minHeight: 64,
    },
    sidebarBrandRow: { alignItems: 'center', flexDirection: 'row' },
    sidebarBrand: {
      color: colors.black,
      fontFamily: FONTS.secondaryBold,
      fontSize: 24,
      letterSpacing: -0.4,
    },
    close: { color: colors.primary, fontFamily: FONTS.secondaryLight, fontSize: 32 },
    sidebarLabel: {
      color: colors.muted,
      fontFamily: FONTS.primaryBold,
      fontSize: 9,
      letterSpacing: 1.2,
      marginBottom: 8,
      marginTop: 28,
    },
    menuItem: {
      alignItems: 'center',
      borderBottomColor: 'rgba(132,165,157,0.26)',
      borderBottomWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row',
      minHeight: 54,
      paddingHorizontal: 4,
    },
    menuItemPressed: { backgroundColor: 'rgba(132,165,157,0.12)', opacity: 0.7 },
    menuItemIcon: { color: colors.tealDark, fontSize: 18, marginRight: 12 },
    menuItemText: {
      color: colors.black,
      flex: 1,
      fontFamily: FONTS.primaryBold,
      fontSize: 11,
      letterSpacing: 0.7,
    },
    menuItemArrow: { color: colors.primary, fontFamily: FONTS.primary, fontSize: 18 },
    sidebarSpacer: { flex: 1 },
    logoutButton: {
      alignItems: 'center',
      borderColor: colors.primary,
      borderWidth: 1.5,
      justifyContent: 'center',
      marginBottom: 22,
      minHeight: 46,
    },
    logoutText: {
      color: colors.primary,
      fontFamily: FONTS.primaryBold,
      fontSize: 10,
      letterSpacing: 0.9,
    },
  });
}
