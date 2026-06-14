import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";

export type DrawTool = "pencil" | "line" | "arc" | "eraser";

interface ToolDef {
  id: DrawTool;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
}

const TOOLS: ToolDef[] = [
  { id: "pencil", icon: "edit-3", label: "Pencil", color: colors.accent },
  { id: "line", icon: "minus", label: "Line", color: colors.primaryLight },
  { id: "arc", icon: "activity", label: "Curve", color: colors.orange },
  { id: "eraser", icon: "delete", label: "Erase", color: colors.red },
];

interface FloatingToolbarProps {
  selectedTool: DrawTool;
  onSelectTool: (tool: DrawTool) => void;
  onUndo: () => void;
  onClear: () => void;
  onLaunch: () => void;
  onHint: () => void;
  canLaunch: boolean;
  isLaunched: boolean;
  showHint: boolean;
}

export function FloatingToolbar({
  selectedTool,
  onSelectTool,
  onUndo,
  onClear,
  onLaunch,
  onHint,
  canLaunch,
  isLaunched,
  showHint,
}: FloatingToolbarProps) {
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue, useNativeDriver: true, speed: 30 }).start();
    setExpanded(!expanded);
  };

  const selectTool = (tool: DrawTool) => {
    onSelectTool(tool);
    setExpanded(false);
    Animated.spring(expandAnim, { toValue: 0, useNativeDriver: true }).start();
  };

  const toolHeight = expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 260] });
  const toolOpacity = expandAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Expandable tools panel */}
      <Animated.View style={[styles.toolPanel, { maxHeight: toolHeight, opacity: toolOpacity }]}>
        {TOOLS.map(tool => (
          <Pressable
            key={tool.id}
            onPress={() => selectTool(tool.id)}
            style={[
              styles.toolBtn,
              selectedTool === tool.id && { backgroundColor: tool.color + "30", borderColor: tool.color },
            ]}
          >
            <Feather name={tool.icon} size={18} color={selectedTool === tool.id ? tool.color : colors.textMuted} />
            <Text style={[styles.toolLabel, selectedTool === tool.id && { color: tool.color }]}>{tool.label}</Text>
          </Pressable>
        ))}
        <View style={styles.divider} />
        <Pressable onPress={onUndo} style={styles.toolBtn}>
          <Feather name="corner-left-up" size={18} color={colors.textMuted} />
          <Text style={styles.toolLabel}>Undo</Text>
        </Pressable>
        <Pressable onPress={onClear} style={styles.toolBtn}>
          <Feather name="trash-2" size={18} color={colors.red} />
          <Text style={[styles.toolLabel, { color: colors.red }]}>Clear</Text>
        </Pressable>
      </Animated.View>

      {/* Bottom action row */}
      <View style={styles.bottomRow}>
        {/* Draw tools toggle */}
        <Pressable
          onPress={toggle}
          style={[styles.iconBtn, { backgroundColor: expanded ? colors.primaryLight : colors.primary }]}
        >
          <Feather name={expanded ? "x" : "edit-2"} size={22} color={colors.white} />
        </Pressable>

        {/* Hint button — always visible */}
        <Pressable
          onPress={onHint}
          style={[styles.iconBtn, { backgroundColor: showHint ? colors.gold : colors.card, borderColor: colors.gold + "60", borderWidth: 1.5 }]}
        >
          <Feather name="help-circle" size={22} color={showHint ? colors.background : colors.gold} />
        </Pressable>

        {/* Launch Button */}
        {!isLaunched && (
          <Pressable
            onPress={canLaunch ? onLaunch : undefined}
            style={[styles.launchBtn, !canLaunch && styles.launchDisabled]}
          >
            <Feather name="play" size={20} color={colors.white} />
            <Text style={styles.launchText}>LAUNCH</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 30,
    left: 16,
    right: 16,
    alignItems: "flex-start",
    gap: 10,
  },
  toolPanel: {
    backgroundColor: colors.card + "EE",
    borderRadius: 20,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    minWidth: 130,
  },
  toolLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.textMuted,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 10,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  launchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.green,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  launchDisabled: { backgroundColor: colors.textDim, shadowOpacity: 0 },
  launchText: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.white, letterSpacing: 1 },
});
