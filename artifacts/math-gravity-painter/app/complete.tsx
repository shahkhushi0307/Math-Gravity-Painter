import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SpaceBackground } from "@/components/ui/SpaceBackground";
import { GlowButton } from "@/components/ui/GlowButton";
import { WORLDS } from "@/data/worlds";
import { useGame } from "@/context/GameContext";
import colors from "@/constants/colors";

export default function CompleteScreen() {
  const { worldId, levelNumber, stars: starsParam, coins: coinsParam } = useLocalSearchParams<{
    worldId: string; levelNumber: string; stars: string; coins: string;
  }>();
  const router = useRouter();
  const { isLevelUnlocked } = useGame();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const wid = parseInt(worldId ?? "1");
  const lnum = parseInt(levelNumber ?? "1");
  const stars = parseInt(starsParam ?? "1");
  const coins = parseInt(coinsParam ?? "10");
  const world = WORLDS.find(w => w.id === wid) ?? WORLDS[0];

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const starAnim0 = useRef(new Animated.Value(0)).current;
  const starAnim1 = useRef(new Animated.Value(0)).current;
  const starAnim2 = useRef(new Animated.Value(0)).current;
  const starAnims = [starAnim0, starAnim1, starAnim2];
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[CompleteScreen] Mounted. Params received:", {
      worldId,
      levelNumber,
      starsParam,
      coinsParam,
    }, "Parsed values:", {
      wid,
      lnum,
      stars,
      coins,
    });
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.stagger(200, starAnims.map(a =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 80, friction: 6 })
      )),
      Animated.timing(confettiAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const hasNext = lnum < 15 && isLevelUnlocked(wid, lnum + 1);

  return (
    <SpaceBackground>
      <View style={[styles.container, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient
            colors={[world.color + "40", colors.card]}
            style={styles.gradient}
          >
            {/* Trophy */}
            <Text style={styles.trophy}>🏆</Text>
            <Text style={styles.completeTitle}>Level Complete!</Text>
            <Text style={[styles.worldName, { color: world.color }]}>{world.emoji} {world.name} · Level {lnum}</Text>

            {/* Stars */}
            <View style={styles.starsRow}>
              {[0, 1, 2].map(i => (
                <Animated.View
                  key={i}
                  style={{
                    transform: [
                      { scale: starAnims[i] },
                      { rotate: i === 1 ? "0deg" : i === 0 ? "-15deg" : "15deg" },
                    ],
                  }}
                >
                  <Feather
                    name="star"
                    size={i === 1 ? 56 : 44}
                    color={i < stars ? colors.gold : colors.textDim}
                  />
                </Animated.View>
              ))}
            </View>

            {/* Rewards */}
            <View style={styles.rewardsRow}>
              <View style={styles.reward}>
                <Feather name="circle" size={22} color={colors.goldLight} />
                <Text style={[styles.rewardVal, { color: colors.goldLight }]}>+{coins}</Text>
                <Text style={styles.rewardLabel}>Coins</Text>
              </View>
              <View style={styles.reward}>
                <Feather name="star" size={22} color={colors.gold} />
                <Text style={[styles.rewardVal, { color: colors.gold }]}>{stars}</Text>
                <Text style={styles.rewardLabel}>Stars</Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <GlowButton
                label="Retry"
                onPress={() => router.replace({ pathname: "/game", params: { worldId: wid, levelNumber: lnum } })}
                color={colors.surface}
                textColor={colors.text}
                size="md"
                style={{ flex: 1 }}
              />
              {hasNext ? (
                <GlowButton
                  label="Next Level"
                  onPress={() => router.replace({ pathname: "/challenge", params: { worldId: wid, levelNumber: lnum + 1 } })}
                  color={world.color}
                  size="md"
                  style={{ flex: 1 }}
                />
              ) : (
                <GlowButton
                  label="Worlds"
                  onPress={() => router.replace("/worlds")}
                  color={world.color}
                  size="md"
                  style={{ flex: 1 }}
                />
              )}
            </View>

            <GlowButton
              label="Main Menu"
              onPress={() => router.replace("/menu")}
              color="transparent"
              textColor={colors.textMuted}
              size="sm"
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </SpaceBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradient: { padding: 28, alignItems: "center", gap: 16 },
  trophy: { fontSize: 64 },
  completeTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.white },
  worldName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  starsRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginVertical: 8 },
  rewardsRow: { flexDirection: "row", gap: 32, marginTop: 8 },
  reward: { alignItems: "center", gap: 4 },
  rewardVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  rewardLabel: { fontSize: 12, color: colors.textMuted },
  buttons: { flexDirection: "row", gap: 12, width: "100%", marginTop: 8 },
});
