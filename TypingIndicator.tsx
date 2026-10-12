import React, { useEffect, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";

export const TypingIndicator: React.FC = () => {
  const dots = useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    []
  );

  useEffect(() => {
    const animations = dots.map((dot, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 280,
            delay: index * 120,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach((anim) => anim.start());

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [dots]);

  return (
    <View style={styles.container}>
      {dots.map((dot, i) => (
        <Animated.View
          key={`dot-${i}`}
          style={[
            styles.dot,
            {
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  translateY: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [2, -2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C8C2FF",
    marginHorizontal: 3,
  },
});

