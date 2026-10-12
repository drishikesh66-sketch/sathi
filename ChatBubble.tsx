import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type Role = "user" | "assistant";

type ChatBubbleProps = {
  role: Role;
  text: string;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ role, text }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateAnim]);

  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      <Animated.View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          { opacity: fadeAnim, transform: [{ translateY: translateAnim }] },
        ]}
      >
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: "100%",
    marginVertical: 6,
    paddingHorizontal: 14,
  },
  rowLeft: {
    alignItems: "flex-start",
  },
  rowRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#0A0818",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  userBubble: {
    backgroundColor: "#6B3CF5",
    borderTopRightRadius: 6,
  },
  assistantBubble: {
    backgroundColor: "#2A2A35",
    borderTopLeftRadius: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
  },
});
