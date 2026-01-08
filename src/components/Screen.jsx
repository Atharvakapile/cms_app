import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({ children, style }) {
  return (
    <SafeAreaView
      edges={['top']}
      style={[{ flex: 1, backgroundColor: '#020617' }, style]}
    >
      {children}
    </SafeAreaView>
  );
}
