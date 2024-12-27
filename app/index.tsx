import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const handleGetStarted = () => {
    // Navigate to another screen or perform some action
    router.push("/upload");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Awesome App</Text>
      <Text style={styles.description}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque vel
        nunc nec ante volutpat ultricies. Vivamus egestas efficitur nunc, vel
        sagittis urna convallis a.
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          color="#0066cc"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 100,
    backgroundColor: "#f8f8f8",
    alignItems: "flex-start",
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#666",
    marginBottom: 40,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "flex-start",
  },
});
