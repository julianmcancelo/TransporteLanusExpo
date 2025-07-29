// This file ensures TypeScript recognizes the hook import if not already present in node_modules
declare module 'react-native-safe-area-context' {
  export function useSafeAreaInsets(): { top: number; bottom: number; left: number; right: number };
}
