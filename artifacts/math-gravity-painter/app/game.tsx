import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { GameCanvas } from "@/components/game/GameCanvas";
import { FloatingToolbar } from "@/components/game/FloatingToolbar";
import type { DrawTool } from "@/components/game/FloatingToolbar";
import { MathChallengeModal } from "@/components/game/MathChallengeModal";
import { WORLDS } from "@/data/worlds";
import { MATH_CHALLENGES } from "@/data/mathChallenges";
import { getLevel } from "@/data/levels";
import { useGame } from "@/context/GameContext";
import colors from "@/constants/colors";

const { width, height } = Dimensions.get("window");

// Level-specific hint texts
const LEVEL_HINTS: Record<string, string> = {
  "w1l1": "Draw a curved ramp from the ball toward the stars, then sweep up to the portal.",
  "w1l2": "Use the platform as a base — draw a path that bounces off it toward both stars.",
  "w1l3": "Draw a zigzag path to collect the upper star first, then curve down to the portal.",
  "w1l4": "Three stars need one smooth arc — try a wide sweeping S-curve across the canvas.",
  "w1l5": "Start your line above the platform and arc it gently toward the portal.",
  "w2l1": "Draw a diagonal line from the ball down to the stars, then angle toward the portal.",
  "w2l2": "Use the platform edge — draw a ramp that launches the ball across.",
  "w3l1": "Geometry world: try drawing a perfect straight line from start to portal.",
  "w4l1": "Algebra world: mirror your path — equal distance on both sides of the center.",
  "w5l1": "Probability zone: try multiple short lines to guide the ball step by step.",
};

function getHint(worldId: number, levelNumber: number): string {
  const key = `w${worldId}l${levelNumber}`;
  return LEVEL_HINTS[key] ?? `Draw a path from the ball 🔵 through the stars ⭐ to the portal 🌀. Press LAUNCH when ready!`;
}

export default function GameScreen() {
  const { worldId, levelNumber } = useLocalSearchParams<{ worldId: string; levelNumber: string }>();
  const router = useRouter();
  const { completeLevelAction, answerQuestion, equippedItems } = useGame();
  const insets = useSafeAreaInsets();

  const wid = parseInt(worldId ?? "1");
  const lnum = parseInt(levelNumber ?? "1");
  const world = WORLDS.find(w => w.id === wid) ?? WORLDS[0];
  const level = getLevel(wid, lnum);
  const challenges = MATH_CHALLENGES[wid] ?? MATH_CHALLENGES[1];
  const challenge = challenges[Math.min(lnum - 1, challenges.length - 1)];

  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 0 : insets.bottom;
  const headerH = topPad + 52;
  const canvasH = Math.max(height - headerH - bottomPad - 110, 300); // 110 = toolbar room
  const canvasW = width;

  const [selectedTool, setSelectedTool] = useState<DrawTool>("pencil");
  const [showHint, setShowHint] = useState(false);
  const [mathVisible, setMathVisible] = useState(false);
  const [mathSolved, setMathSolved] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [isLaunched, setIsLaunched] = useState(false);
  const [hasPath, setHasPath] = useState(false);
  const [shouldReset, setShouldReset] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const collectedCountRef = useRef(0);
  const totalStars = level?.starPositions.length ?? 2;

  const ballColor = equippedItems.ball === "ball_purple" ? "#7C3AED"
    : equippedItems.ball === "ball_gold" ? "#F59E0B"
    : equippedItems.ball === "ball_red" ? "#EF4444"
    : equippedItems.ball === "ball_green" ? "#10B981"
    : "#06B6D4";

  const portalColor = equippedItems.portal === "portal_gold" ? "#F59E0B"
    : equippedItems.portal === "portal_purple" ? "#7C3AED"
    : "#06B6D4";

  const handleStarCollected = useCallback((id: string) => {
    collectedCountRef.current += 1;
    setCollectedCount(collectedCountRef.current);
  }, []);

  const handlePortalReached = useCallback(() => {
    console.log("[game.tsx] handlePortalReached triggered. current gameComplete:", gameComplete);
    if (gameComplete) return;
    setGameComplete(true);
    const stars = collectedCountRef.current >= totalStars ? 3
      : collectedCountRef.current >= Math.ceil(totalStars / 2) ? 2 : 1;
    const coins = stars * 10 + lnum * 5;
    console.log(`[game.tsx] Completing level internally. Level: w${wid}l${lnum}, Stars: ${stars}, Coins: ${coins}`);
    completeLevelAction(`w${wid}l${lnum}`, stars, coins);
    console.log("[game.tsx] completeLevelAction finished. Navigating to /complete in 500ms");
    setTimeout(() => {
      console.log(`[game.tsx] Executing router.replace to /complete with stringified params: worldId=${wid}, levelNumber=${lnum}, stars=${stars}, coins=${coins}`);
      router.replace({
        pathname: "/complete",
        params: {
          worldId: String(wid),
          levelNumber: String(lnum),
          stars: String(stars),
          coins: String(coins)
        }
      });
    }, 500);
  }, [gameComplete, totalStars, wid, lnum]);

  const handleMathNeeded = useCallback(() => {
    if (!mathSolved) setMathVisible(true);
  }, [mathSolved]);

  const handleMathCorrect = useCallback(() => {
    setMathVisible(false);
    setMathSolved(true);
    answerQuestion(true);
  }, []);

  const handleMathWrong = useCallback(() => {
    answerQuestion(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsLaunched(false);
    setGameComplete(false);
    setCollectedCount(0);
    collectedCountRef.current = 0;
    setHasPath(false);
    setShowHint(false);
    setShouldReset(true);
  }, []);

  const handleLaunch = useCallback(() => {
    if (hasPath && !isLaunched) {
      setIsLaunched(true);
    }
  }, [hasPath, isLaunched]);

  if (!level) {
    return (
      <View style={styles.errorView}>
        <Text style={styles.errorText}>Level not found</Text>
      </View>
    );
  }

  const hintText = getHint(wid, lnum);

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={[colors.background + "FF", colors.background + "00"] as any}
        style={[styles.header, { paddingTop: topPad + 10, height: headerH }]}
        pointerEvents="box-none"
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.white} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={[styles.levelLabel, { color: world.color }]}>{world.emoji} {world.name}</Text>
          <Text style={styles.levelSub}>Level {lnum}</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Stars collected */}
          <View style={styles.starsDisplay}>
            {Array.from({ length: totalStars }).map((_, i) => (
              <Feather
                key={i}
                name="star"
                size={16}
                color={i < collectedCount ? colors.gold : colors.textDim}
              />
            ))}
          </View>
          {/* Math status */}
          {mathSolved ? (
            <View style={styles.solvedBadge}>
              <Feather name="check-circle" size={12} color={colors.green} />
              <Text style={styles.solvedText}>Math ✓</Text>
            </View>
          ) : (
            <Pressable onPress={() => setMathVisible(true)} style={styles.mathBadge}>
              <Feather name="zap" size={12} color={world.color} />
              <Text style={[styles.mathBadgeText, { color: world.color }]}>Math</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      {/* Game Canvas */}
      <View style={[styles.canvasWrap, { marginTop: headerH - 20, backgroundColor: world.color + "06" }]}>
        <GameCanvas
          level={level}
          selectedTool={selectedTool}
          showHint={showHint}
          mathSolved={mathSolved}
          portalColor={portalColor}
          ballColor={ballColor}
          onStarCollected={handleStarCollected}
          onPortalReached={handlePortalReached}
          onMathNeeded={handleMathNeeded}
          isLaunched={isLaunched}
          setIsLaunched={setIsLaunched}
          canvasWidth={canvasW}
          canvasHeight={canvasH}
          onPathDrawn={setHasPath}
          shouldReset={shouldReset}
          onResetDone={() => setShouldReset(false)}
          hintText={hintText}
          gameComplete={gameComplete}
        />
      </View>

      {/* Floating Toolbar */}
      <FloatingToolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onUndo={() => {}}
        onClear={handleReset}
        onLaunch={handleLaunch}
        onHint={() => setShowHint(v => !v)}
        canLaunch={hasPath && !isLaunched}
        isLaunched={isLaunched}
        showHint={showHint}
      />

      {/* Reset button when ball is in flight */}
      {isLaunched && !gameComplete && (
        <View style={styles.resetRow} pointerEvents="box-none">
          <Pressable onPress={handleReset} style={styles.resetBtn}>
            <Feather name="rotate-ccw" size={18} color={colors.white} />
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      )}

      {/* Math Challenge Modal */}
      <MathChallengeModal
        visible={mathVisible}
        challenge={challenge}
        worldColor={world.color}
        onCorrect={handleMathCorrect}
        onWrong={handleMathWrong}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card + "AA",
    borderRadius: 20,
  },
  headerCenter: { flex: 1 },
  levelLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  levelSub: { fontSize: 11, color: colors.textMuted, fontFamily: "Inter_500Medium" },
  headerRight: { alignItems: "flex-end", gap: 4 },
  starsDisplay: { flexDirection: "row", gap: 3 },
  solvedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.green + "25",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  solvedText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.green },
  mathBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mathBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  canvasWrap: { flex: 1 },
  resetRow: {
    position: "absolute",
    bottom: 110,
    right: 16,
    zIndex: 20,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card + "EE",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: { fontSize: 13, color: colors.white, fontFamily: "Inter_600SemiBold" },
  errorView: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  errorText: { color: colors.white, fontSize: 18 },
});
