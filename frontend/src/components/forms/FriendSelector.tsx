import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { FriendProfile } from '../../api/usersApi';
import { COLORS, FONTS } from '../../constants';

type Props = {
  error?: string;
  friends: FriendProfile[];
  loading: boolean;
  onToggle: (authUserId: string) => void;
  selectedIds: string[];
};

export default function FriendSelector({ error, friends, loading, onToggle, selectedIds }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>ADD FRIENDS</Text>
      <View style={styles.list}>
        {loading ? (
          <View style={styles.messageRow}>
            <ActivityIndicator color={COLORS.tealDark} size="small" />
            <Text style={styles.message}>LOADING FRIENDS...</Text>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : friends.length ? (
          friends.map((friend) => {
            const selected = selectedIds.includes(friend.authUserId);
            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                key={friend.authUserId}
                onPress={() => onToggle(friend.authUserId)}
                style={({ pressed }) => [
                  styles.friend,
                  selected && styles.selectedFriend,
                  pressed && styles.pressedFriend,
                ]}
              >
                <View style={[styles.avatar, selected && styles.selectedAvatar]}>
                  <Text style={[styles.initials, selected && styles.selectedInitials]}>
                    {initials(friend.displayName)}
                  </Text>
                </View>
                <View style={styles.copy}>
                  <Text style={styles.name}>{friend.displayName}</Text>
                  <Text numberOfLines={1} style={styles.email}>
                    {friend.email}
                  </Text>
                </View>
                <Text style={[styles.check, selected && styles.selectedCheck]}>
                  {selected ? '✓' : '＋'}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.message}>NO FRIENDS TO ADD YET.</Text>
        )}
      </View>
    </View>
  );
}

function initials(displayName: string) {
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

const styles = StyleSheet.create({
  field: { marginBottom: 18 },
  label: {
    color: COLORS.text,
    fontFamily: FONTS.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  list: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderColor: COLORS.teal,
    borderWidth: 1.5,
    padding: 8,
  },
  friend: {
    alignItems: 'center',
    borderBottomColor: 'rgba(132,165,157,0.25)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: 7,
    paddingVertical: 6,
  },
  selectedFriend: { backgroundColor: 'rgba(132,165,157,0.14)' },
  pressedFriend: { opacity: 0.65 },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(132,165,157,0.18)',
    borderColor: COLORS.teal,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginRight: 10,
    width: 36,
  },
  selectedAvatar: { backgroundColor: COLORS.tealDark },
  initials: { color: COLORS.tealDark, fontFamily: FONTS.primary, fontSize: 10 },
  selectedInitials: { color: '#fff' },
  copy: { flex: 1 },
  name: { color: COLORS.black, fontFamily: FONTS.secondary, fontSize: 14 },
  email: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 9, marginTop: 2 },
  check: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 16, marginLeft: 8 },
  selectedCheck: { color: COLORS.tealDark, fontWeight: '700' },
  messageRow: { alignItems: 'center', flexDirection: 'row', gap: 9, padding: 12 },
  message: { color: COLORS.muted, fontFamily: FONTS.primary, fontSize: 10, padding: 12 },
  error: { color: COLORS.primary, fontFamily: FONTS.primary, fontSize: 10, padding: 12 },
});
