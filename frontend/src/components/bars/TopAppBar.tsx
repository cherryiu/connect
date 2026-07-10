import { COLORS, IMAGES } from '../../constants';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function TopAppBar() {
  return (
    <View style={styles.topBar}>
      <View style={styles.peekSticker}>
        <Text style={styles.peekStickerText}>☻</Text>
      </View>

      <View style={styles.brandRow}>
        <Pressable hitSlop={10} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>☰</Text>
        </Pressable>
        <Text style={styles.brandTitle}>OUR SCRAPBOOK</Text>
      </View>

      <Pressable style={styles.avatarFrame}>
        <Image source={{ uri: IMAGES.avatar }} style={styles.avatarImage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarFrame: {
    borderColor: COLORS.teal,
    borderWidth: 2,
    height: 40,
    overflow: 'hidden',
    width: 40,
    borderRadius: 20,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  topBar: {
    height: 60,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  peekSticker: {
    position: 'absolute',
    top: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekStickerText: {
    color: '#fff',
    fontSize: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    color: COLORS.primary,
    flexShrink: 1,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0,
  },
  iconButton: {
    marginRight: 10,
  },
  iconButtonText: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: '800',
  },
});
