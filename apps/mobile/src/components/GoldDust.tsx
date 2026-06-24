import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../theme/colors";

const PARTICLE_COUNT = 14;

type Particle = {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
};

function seedParticles(): Particle[] {
  const particles: Particle[] = [];
  const goldColors = [colors.dustGold, colors.dustGoldLight, colors.dustWhite];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: (i * 7.3 + 13) % 100,
      y: (i * 11.7 + 5) % 100,
      size: 1.5 + (i % 3) * 1,
      duration: 4000 + (i % 5) * 1200,
      delay: (i * 600) % 3000,
      drift: ((i % 2 === 0 ? 1 : -1) * (8 + (i % 4) * 4)),
      color: goldColors[i % goldColors.length]!,
    });
  }
  return particles;
}

const particles = seedParticles();

function DustParticle({ p }: { p: Particle }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const loop = () => {
        opacity.setValue(0);
        translateY.setValue(0);
        translateX.setValue(0);
        Animated.parallel([
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.9, duration: p.duration * 0.3, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0.4, duration: p.duration * 0.4, useNativeDriver: false }),
            Animated.timing(opacity, { toValue: 0, duration: p.duration * 0.3, useNativeDriver: false }),
          ]),
          Animated.timing(translateY, { toValue: -60, duration: p.duration, useNativeDriver: false }),
          Animated.sequence([
            Animated.timing(translateX, { toValue: p.drift, duration: p.duration * 0.5, useNativeDriver: false }),
            Animated.timing(translateX, { toValue: -p.drift * 0.5, duration: p.duration * 0.5, useNativeDriver: false }),
          ]),
        ]).start(() => loop());
      };
      loop();
    }, p.delay);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.size,
        borderRadius: p.size,
        backgroundColor: p.color,
        opacity,
        transform: [{ translateY }, { translateX }],
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: p.size * 2,
      }}
    />
  );
}

export function GoldDust() {
  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <DustParticle key={i} p={p} />
      ))}
    </View>
  );
}

export function AmbientOrbs() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.orb, styles.orbTopRight]} />
      <View style={[styles.orb, styles.orbBottomLeft]} />
      <View style={[styles.orb, styles.orbCenter]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
  },
  orbTopRight: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    backgroundColor: colors.orbGold,
  },
  orbBottomLeft: {
    width: 250,
    height: 250,
    bottom: 100,
    left: -100,
    backgroundColor: colors.orbBlue,
  },
  orbCenter: {
    width: 200,
    height: 200,
    top: "40%",
    right: -60,
    backgroundColor: colors.orbGold,
  },
});
