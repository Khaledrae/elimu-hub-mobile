import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../src/constants/theme';

export default function LaunchScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../src/animations/RemixOfRabbitHi.json')}
        autoPlay
        loop
        style={styles.lottie}
      />
      {/* <ActivityIndicator size="large" color={colors.primary.yellow} /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  lottie: { width: 180, height: 180 },
});
