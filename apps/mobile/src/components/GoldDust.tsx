import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
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
      <Svg style={styles.waves} viewBox="0 0 420 190" preserveAspectRatio="none">
        <Path d="M-20 112 C 72 32, 126 184, 220 104 S 360 54, 450 128" stroke="rgba(217,154,38,0.22)" strokeWidth="1" fill="none" />
        <Path d="M-24 128 C 68 54, 134 196, 228 116 S 360 76, 450 142" stroke="rgba(217,154,38,0.16)" strokeWidth="1" fill="none" />
        <Path d="M-28 144 C 74 74, 132 210, 238 130 S 366 96, 454 156" stroke="rgba(243,198,94,0.10)" strokeWidth="1" fill="none" />
        <Path d="M-34 160 C 76 98, 138 224, 246 144 S 372 118, 462 170" stroke="rgba(217,154,38,0.08)" strokeWidth="1" fill="none" />
      </Svg>
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
    width: 260,
    height: 260,
    top: -90,
    right: -120,
    backgroundColor: colors.orbGold,
  },
  orbBottomLeft: {
    width: 320,
    height: 320,
    bottom: -80,
    left: -160,
    backgroundColor: colors.orbBlue,
  },
  orbCenter: {
    width: 200,
    height: 200,
    top: "40%",
    right: -60,
    backgroundColor: colors.orbGold,
  },
  waves: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -10,
    height: 190,
    opacity: 0.9,
  },
});
