import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, FONTS } from '../../constants';

type Props = {
  activeItem?: NavItem;
  onCalendar?: () => void;
  onCreate: () => void;
  onFriends?: () => void;
  onLogs?: () => void;
};

type NavItem = 'logs' | 'calendar' | 'friends';

const navItems: { label: NavItem; icon: string }[] = [
  { label: 'logs', icon: 'ᝰ' },
  { label: 'calendar', icon: '☑' },
  { label: 'friends', icon: '𐀪𐀪' },
];

export default function BottomNavBar({
  activeItem = 'calendar',
  onCalendar,
  onCreate,
  onFriends,
  onLogs,
}: Props) {
  const actions: Partial<Record<NavItem, () => void>> = {
    calendar: onCalendar,
    friends: onFriends,
    logs: onLogs,
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = item.label === activeItem;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={item.label}
            onPress={actions[item.label]}
            style={({ pressed }) => [
              styles.item,
              active && styles.activeItem,
              pressed && styles.pressedItem,
            ]}
          >
            <Text style={[styles.icon, active && styles.activeText]}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.activeText]}>{item.label}</Text>
          </Pressable>
        );
      })}

      <Pressable
        accessibilityLabel="Create a hangout"
        accessibilityRole="button"
        onPress={onCreate}
        style={({ pressed }) => [styles.createItem, pressed && styles.pressedItem]}
      >
        <Text style={styles.createIcon}>＋</Text>
        <Text style={styles.createLabel}>new</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: 'rgba(255,250,245,0.96)',
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderWidth: 1,
    bottom: 12,
    flexDirection: 'row',
    left: 14,
    minHeight: 58,
    padding: 4,
    position: 'absolute',
    right: 14,
    shadowColor: '#000',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  activeItem: { backgroundColor: 'rgba(156,65,65,0.08)', borderRadius: 6 },
  pressedItem: { opacity: 0.58 },
  icon: { color: COLORS.muted, fontSize: 17 },
  label: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 9, marginTop: 2 },
  activeText: { color: COLORS.primary, fontWeight: '700' },
  createItem: {
    alignItems: 'center',
    borderLeftColor: 'rgba(156,65,65,0.22)',
    borderLeftWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  createIcon: { color: COLORS.primary, fontSize: 20, lineHeight: 20 },
  createLabel: {
    color: COLORS.primary,
    fontFamily: FONTS.primary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
