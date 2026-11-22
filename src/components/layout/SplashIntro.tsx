import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface SplashIntroProps {
  onFinish: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SPLASH_BG = '#FFA500';

/**
 * Plays a single "YAMU" slide-in, center-hold, and slide-out transition
 * matching the cropped YAMU intro video on initial app launch.
 */
export const SplashIntro: React.FC<SplashIntroProps> = ({ onFinish }) => {
  const translateX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Slide YAMU wordmark in from left to center (0.0s -> 1.15s)
      Animated.timing(translateX, {
        toValue: 0,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // 2. Hold in center (1.15s -> 1.90s)
      Animated.delay(750),
      // 3. Slide YAMU wordmark out to right (1.90s -> 2.75s)
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 850,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      // 4. Smoothly fade out the #F5971C splash screen into the app
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [translateX, containerOpacity, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <StatusBar style="dark" />
      <View style={styles.track}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Image
            source={require('../../../assets/yamu-wordmark.png')}
            style={styles.wordmark}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  track: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  wordmark: {
    width: 240,
    height: 84,
  },
});
