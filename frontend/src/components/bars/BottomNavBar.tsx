import { COLORS } from '../../constants';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const navItems = [
  { label: 'CALENDAR', icon: '▣', active: true },
  { label: 'LOGS', icon: '▤' },
  { label: 'SCHED', icon: '✓' },
  { label: 'FRIENDS', icon: '◎' },
];

export default function BottomNavBar() {
  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => (
        <Pressable
          key={item.label}
          style={[styles.navItem, item.active ? styles.activeNavItem : null]}
        >
          <Text style={[styles.navIcon, item.active ? styles.activeNavText : null]}>
            {item.icon}
          </Text>
          <Text style={[styles.navLabel, item.active ? styles.activeNavText : null]}>
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderTopColor: COLORS.teal,
    borderTopWidth: 4,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    left: 0,
    paddingBottom: 28,
    paddingHorizontal: 8,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    zIndex: 2,
  },
  navIcon: {
    color: COLORS.tealDark,
  },
  navLabel: {
    color: COLORS.tealDark,
    fontSize: 19,
    fontWeight: '900',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 72,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  activeNavItem: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.teal,
    borderWidth: 2,
    borderRadius: 8,
  },
  activeNavText: {
    color: COLORS.text,
  },
});
