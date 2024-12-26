import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { ResizeMode, Video } from "expo-av";

// Import the custom hook from your provider
import { useVideo } from "../store/VideoDataProvider"; // Adjust path as needed

export default function AnalyzeScreen() {
  // Get the global video store from your provider
  const {
    state: { videos },
  } = useVideo();

  // If no videos, show a fallback
  if (!videos || videos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideosText}>No videos to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Container */}
      <View style={styles.navigationContainer}>
        <Text style={styles.navigationText}>Navigation</Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {videos.map((videoItem, index) => (
            <Video
              key={index}
              source={{ uri: videoItem.videoUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  navigationText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  videoContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  video: {
    width: 200,
    height: 300,
    marginRight: 10,
    backgroundColor: "#000",
  },
  noVideosText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    color: "#888",
  },
});
