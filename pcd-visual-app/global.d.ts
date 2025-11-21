// global.d.ts
declare module 'expo-router';
declare module 'lucide-react-native';
declare module 'expo-av';

// Para assets
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

// Declarações globais para require (se necessário)
declare var require: {
  (path: string): any;
  context: (directory: string, useSubdirectories?: boolean, regExp?: RegExp) => any;
};