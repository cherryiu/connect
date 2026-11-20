import { useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAppIconState, setAppIcon, supportsAlternateIcons } from 'expo-awesome-app-icon';

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
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [darkAppIcon, setDarkAppIcon] = useState(false);
  const [changingAppIcon, setChangingAppIcon] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    try {
      setDarkAppIcon(getAppIconState().selected === 'dark');
    } catch {
      // Alternate icons are unavailable in Expo Go and before a native rebuild.
      setDarkAppIcon(false);
    }
  }, [sidebarOpen]);

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

  const changeAppIcon = async (useDarkIcon: boolean) => {
    try {
      if (!supportsAlternateIcons()) {
        Alert.alert('App icon unavailable', 'Rebuild the native app to enable alternate icons.');
        return;
      }
      setChangingAppIcon(true);
      await setAppIcon(
        useDarkIcon ? 'dark' : null,
        Platform.OS === 'android' ? { deferUntilBackground: true } : undefined,
      );
      setDarkAppIcon(useDarkIcon);
    } catch {
      Alert.alert('Icon could not be changed', 'Please try again after restarting the app.');
    } finally {
      setChangingAppIcon(false);
    }
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

          <View
            style={[
              styles.sidebar,
              {
                marginBottom: Math.max(insets.bottom, 8),
                marginTop: Math.max(insets.top, 8),
              },
            ]}
          >
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
              <View style={styles.menuItemIconContainer}>
                <SettingsGearIcon />
              </View>
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
            <View style={styles.menuItem}>
              <View style={styles.menuItemIconContainer}>
                <View style={styles.appIconGlyph}>
                  <View style={styles.appIconGlyphLight} />
                  <View style={styles.appIconGlyphDark} />
                </View>
              </View>
              <Text style={styles.menuItemText}>DARK APP ICON</Text>
              {changingAppIcon ? (
                <ActivityIndicator color={colors.tealDark} size="small" />
              ) : (
                <Switch
                  accessibilityLabel="Dark app icon"
                  onValueChange={(value) => void changeAppIcon(value)}
                  thumbColor={darkAppIcon ? colors.surface : '#fffaf5'}
                  trackColor={{ false: '#cfc6bd', true: colors.teal }}
                  value={darkAppIcon}
                />
              )}
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingsGearIcon() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.gearIcon}
    >
      {[0, 45, 90, 135].map((rotation) => (
        <View
          key={rotation}
          style={[styles.gearTooth, { transform: [{ rotate: `${rotation}deg` }] }]}
        />
      ))}
      <View style={styles.gearRing}>
        <View style={styles.gearCenter} />
      </View>
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
    modalRoot: {
      backgroundColor: 'rgba(10,8,7,0.48)',
      flex: 1,
      flexDirection: 'row',
    },
    sidebar: {
      backgroundColor: colors.background,
      borderLeftColor: colors.teal,
      borderLeftWidth: 1.5,
      borderBottomLeftRadius: 12,
      borderTopLeftRadius: 12,
      overflow: 'hidden',
      paddingHorizontal: 20,
      shadowColor: '#000',
      shadowOffset: { height: 0, width: -5 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      width: '78%',
      zIndex: 2,
    },
    backdrop: { flex: 1 },
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
    menuItemIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      width: 20,
    },
    gearIcon: { height: 20, position: 'relative', width: 20 },
    gearTooth: {
      backgroundColor: colors.tealDark,
      borderRadius: 1,
      height: 3,
      left: 0,
      position: 'absolute',
      top: 8.5,
      width: 20,
    },
    gearRing: {
      alignItems: 'center',
      backgroundColor: colors.background,
      borderColor: colors.tealDark,
      borderRadius: 7,
      borderWidth: 2,
      height: 14,
      justifyContent: 'center',
      left: 3,
      position: 'absolute',
      top: 3,
      width: 14,
    },
    gearCenter: {
      borderColor: colors.tealDark,
      borderRadius: 2,
      borderWidth: 1.5,
      height: 4,
      width: 4,
    },
    appIconGlyph: {
      borderColor: colors.tealDark,
      borderRadius: 5,
      borderWidth: 1,
      flexDirection: 'row',
      height: 20,
      overflow: 'hidden',
      width: 20,
    },
    appIconGlyphLight: { backgroundColor: '#FBF5EF', flex: 1 },
    appIconGlyphDark: { backgroundColor: '#1E1B19', flex: 1 },
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
