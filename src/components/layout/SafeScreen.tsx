import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

interface SafeScreenProps {
  children: React.ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
}

export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  edges = ['top', 'left', 'right'],
  style,
}) => {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

