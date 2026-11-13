import { useFonts } from 'expo-font';

export function useAppFonts() {
  return useFonts({
    // Static require calls let Metro include these binary assets in native bundles.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'jetbrains-mono': require('../../assets/JetBrainsMono-Regular.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'jetbrains-mono-medium': require('../../assets/JetBrainsMonoNL-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'geist-medium': require('../../assets/Geist-Medium.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'geist-bold': require('../../assets/Geist-Bold.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'geist-light': require('../../assets/Geist-Light.ttf'),
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    'geist-italic': require('../../assets/Geist-Italic.ttf'),
  });
}
