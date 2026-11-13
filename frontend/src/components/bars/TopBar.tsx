import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text, Image, Pressable } from 'react-native';
import { COLORS, IMAGES, FONTS } from '../../constants';
import { RootStackParamList } from '../../navigation/RootNavigator';

type TopBarProps = {
  avatarUrl?: string | null;
  onLogout: () => Promise<void>;
};

type MenuNavigation = NativeStackNavigationProp<RootStackParamList, 'ViewProfileScreen'>;

export default function TopBar({ avatarUrl, onLogout }: TopBarProps) {
  const navigation = useNavigation<MenuNavigation>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setLoggingOut(true);
      await onLogout();
      setMenuOpen(false);
    } finally {
      setLoggingOut(false);
    }
  };

  const openProfileScreen = () => {
    navigation.navigate('ViewProfileScreen');
  };

  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <Text style={styles.menuIcon}>☰</Text>
        <Text style={styles.brand}>COZE</Text>
      </View>
      <Pressable
        accessibilityLabel="Open profile menu"
        accessibilityRole="button"
        accessibilityState={{ expanded: menuOpen }}
        hitSlop={8}
        onPress={() => setMenuOpen((open) => !open)}
      >
        <Image source={{ uri: avatarUrl || IMAGES.avatar }} style={styles.avatar} />
      </Pressable>

      {menuOpen ? (
        <View style={styles.profileMenu}>
          <Pressable
            accessibilityRole="button"
            disabled={loggingOut}
            onPress={() => void logout()}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            {loggingOut ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.logoutText}>Log Out</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={loggingOut}
            onPress={() => openProfileScreen()}
            style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
          >
            {loggingOut ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.logoutText}>View Profile</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(251,245,239,0.96)',
    borderBottomColor: COLORS.teal,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 66,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row' },
  menuIcon: { color: COLORS.primary, fontSize: 22, marginRight: 14 },
  brand: { color: COLORS.primary, fontFamily: FONTS.primary, fontSize: 17, fontWeight: '700' },
  avatar: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  profileMenu: {
    backgroundColor: '#fffaf5',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    minWidth: 130,
    position: 'absolute',
    right: 20,
    shadowColor: '#000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    top: 58,
    elevation: 8,
  },
  menuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 18,
  },
  menuButtonPressed: { backgroundColor: 'rgba(156,65,65,0.08)' },
  logoutText: {
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
});
