import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  text: string;
};

const ASSISTANT_NAME = "Priya";

const initialAssistantMessage =
  "Hi... I wasn't sure if you'd actually talk to me. What should I call you?";

const getAssistantMessage = (step: number, name: string) => {
  if (step === 1) {
    return `${name}, nice to meet you. Are you from around here or did you move somewhere new?`;
  }
  if (step === 2) {
    return "What's been on your mind lately - work, something personal, or just life?";
  }
  if (step === 3) {
    return "I like knowing I'm actually needed. What made you try something like this?";
  }
  return "Okay... I think I like talking to you. Let's continue.";
};

const randomDelay = () => 1000 + Math.floor(Math.random() * 1000);

const followUps = [
  "Tell me more about that.",
  "I'm listening. Want to go a little deeper?",
  "That makes sense. What do you wish was different?",
  "You're not alone in that. What's the hardest part?",
  "If you could change one thing, what would it be?",
  "Thanks for sharing that with me.",
];

export const OnboardingChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "assistant-0", role: "assistant", text: initialAssistantMessage },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Friend");

  const listRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(focusTimer);
  }, []);

  const sendAssistantMessage = useCallback((reply: string, action?: () => void) => {
    setIsTyping(true);
    timeoutRef.current = setTimeout(() => {
      if (action) {
        action();
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: reply,
        },
      ]);
      setIsTyping(false);
      inputRef.current?.focus();
    }, randomDelay());
  }, []);

  const tryOpenUrl = useCallback(async (primary: string, fallback: string) => {
    try {
      const canOpen = await Linking.canOpenURL(primary);
      if (canOpen) {
        await Linking.openURL(primary);
        return;
      }
      await Linking.openURL(fallback);
    } catch {
      // If opening fails, the assistant reply will still guide the user.
    }
  }, []);

  const buildAssistantReply = useCallback(
    (text: string, currentName: string) => {
      const normalized = text.toLowerCase();

      if (normalized.includes("open youtube") || normalized.includes("open yt")) {
        return {
          reply: "Opening YouTube for you.",
          action: () => tryOpenUrl("youtube://", "https://www.youtube.com"),
        };
      }

      if (normalized.includes("open spotify")) {
        return {
          reply: "Opening Spotify.",
          action: () => tryOpenUrl("spotify://", "https://open.spotify.com"),
        };
      }

      if (normalized.includes("open whatsapp")) {
        return {
          reply: "Opening WhatsApp.",
          action: () => tryOpenUrl("whatsapp://", "https://wa.me/"),
        };
      }

      if (normalized.includes("send hi to")) {
        const match = text.match(/send hi to\s+([+\d][\d\s-]{6,})/i);
        if (match) {
          const digits = match[1].replace(/[^\d+]/g, "");
          return {
            reply: "Opening WhatsApp with a pre-filled hello.",
            action: () =>
              tryOpenUrl(
                `whatsapp://send?phone=${digits}&text=Hi`,
                `https://wa.me/${digits}?text=Hi`
              ),
          };
        }
        return {
          reply:
            "I can open WhatsApp with a message if you share the phone number (with country code).",
        };
      }

      const moodReply =
        followUps[Math.floor(Math.random() * followUps.length)] ??
        "I'm here with you.";
      const personalize = Math.random() > 0.5 ? ` ${currentName},` : "";
      return {
        reply: `${personalize} ${moodReply}`.replace("  ", " ").trim(),
      };
    },
    [tryOpenUrl]
  );

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const nextName = step === 1 ? trimmed : name;
    if (step === 1) {
      setName(trimmed);
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", text: trimmed },
    ]);
    setInputValue("");

    if (step <= 4) {
      const reply = getAssistantMessage(step, nextName);
      sendAssistantMessage(reply);
      setStep((prev) => prev + 1);
      return;
    }

    const { reply, action } = buildAssistantReply(trimmed, nextName);
    sendAssistantMessage(reply, action);
  }, [buildAssistantReply, inputValue, name, sendAssistantMessage, step]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    return <ChatBubble role={item.role} text={item.text} />;
  }, []);

  const listFooter = useMemo(() => {
    if (!isTyping) return <View style={styles.footerSpacer} />;
    return (
      <View style={styles.typingRow}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingLabel}>{ASSISTANT_NAME} is typing...</Text>
          <TypingIndicator />
        </View>
      </View>
    );
  }, [isTyping]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundGlowSecondary} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={<AvatarHeader />}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={listFooter}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Type your reply..."
            placeholderTextColor="#8E8AA7"
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            activeOpacity={0.8}
          >
            <Text style={styles.sendLabel}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const AvatarHeader = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, pulseAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });
  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.65],
  });

  return (
    <View style={styles.avatarHeader}>
      <View style={styles.avatarTextBlock}>
        <Text style={styles.avatarTitle}>{ASSISTANT_NAME}</Text>
        <Text style={styles.avatarSubtitle}>Your late-night companion</Text>
      </View>
      <View style={styles.avatarStage}>
        <Animated.View
          style={[
            styles.avatarGlow,
            { transform: [{ scale: glowScale }], opacity: glowOpacity },
          ]}
        />
        <Animated.View style={[styles.avatarOrb, { transform: [{ translateY }] }]}>
          <View style={styles.avatarCore} />
          <View style={styles.avatarRing} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0D0B1E",
  },
  container: {
    flex: 1,
    backgroundColor: "#0D0B1E",
  },
  backgroundGlow: {
    position: "absolute",
    top: -120,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(107, 60, 245, 0.25)",
  },
  backgroundGlowSecondary: {
    position: "absolute",
    bottom: -140,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(36, 214, 255, 0.12)",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  avatarHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  avatarTextBlock: {
    marginBottom: 12,
  },
  avatarTitle: {
    color: "#F1EDFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  avatarSubtitle: {
    color: "#AAA4C8",
    fontSize: 13,
    marginTop: 4,
  },
  avatarStage: {
    alignItems: "center",
    justifyContent: "center",
    height: 160,
  },
  avatarGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(107, 60, 245, 0.35)",
  },
  avatarOrb: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#1E1B36",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6B3CF5",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  avatarCore: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(132, 92, 255, 0.9)",
  },
  avatarRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  typingRow: {
    alignItems: "flex-start",
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 10,
  },
  typingBubble: {
    backgroundColor: "#2A2A35",
    borderRadius: 18,
    borderTopLeftRadius: 6,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  typingLabel: {
    color: "#B9B4D6",
    fontSize: 12,
    marginBottom: 2,
  },
  footerSpacer: {
    height: 8,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#111024",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#FFFFFF",
    backgroundColor: "#1A1832",
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#6B3CF5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  sendLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});

