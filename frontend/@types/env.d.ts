declare module '@env' {
  export const API_URL: string;
  export const APP_ENV: string;
}

declare module '*.jpg' {
  import type { ImageSourcePropType } from 'react-native';

  const source: ImageSourcePropType;
  export default source;
}
