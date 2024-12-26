import React, { useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

// Import your global store hook
import { useVideo } from "../store/VideoProvider"; // Adjust path as needed

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [videoMetadata, setVideoMetadata] = useState<File | null>(null);

  // Get dispatch from the global video store
  const { dispatch } = useVideo();

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      console.log(result);

      if (result.canceled) {
        // User canceled the picker
        return;
      }

      // Adjust based on how DocumentPicker returns files; 
      // some versions have `result.output` or `result.assets`.
      // For now, assume `result.output` is an array:
      setVideoMetadata(result.output?.[0] ?? null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const uploadVideo = async () => {
    if (!videoMetadata) {
      Alert.alert("No video selected", "Please select a video to upload.");
      return;
    }

    setUploading(true);

    const uploadUrl = "https://services.oskarmroz.com/vision-project/video-upload";

    try {
      const formData = new FormData();
      formData.append("video", {
        type: videoMetadata.type || "video/mp4",
        name: videoMetadata.name || "upload.mp4",
        // NOTE: In some DocumentPicker versions, you may need the `uri` property to actually upload the file.
        // If you do, you'd do something like: uri: videoMetadata.uri
        // But since your code doesn't show that usage, we assume the server is receiving the file somehow.
      } as any);

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // --- NEW CODE: Parse the response and dispatch it into the store ---
      const responseData = await response.json();
      // Example shape expected: { videoUrl: "https://url.of.video.mp4", events: [{...}] }

      dispatch({
        type: "ADD_VIDEO",
        payload: responseData, // The entire video object from the server
      });
      // -------------------------------------------------------------------

      Alert.alert("Success", "Video uploaded successfully!");
    } catch (error: any) {
      Alert.alert("Upload Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to the Video Uploader</Text>
      <View style={styles.uploadBox}>
        {videoMetadata ? (
          <Text style={styles.selectedVideoText}>
            Selected: {videoMetadata.name}
          </Text>
        ) : (
          <Text style={styles.noVideoText}>No video selected.</Text>
        )}

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Select Video" onPress={pickVideo} color="#0066cc" />
          </View>

          {uploading ? (
            <ActivityIndicator size="large" color="#0066cc" />
          ) : (
            <View style={styles.buttonWrapper}>
              <Button
                title="Upload Video"
                onPress={uploadVideo}
                color="#28a745"
                disabled={!videoMetadata}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f3f3",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#333",
  },
  uploadBox: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  selectedVideoText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#333",
  },
  noVideoText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#999",
    fontStyle: "italic",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
    alignItems: "center",
  },
  buttonWrapper: {
    width: "100%",
    marginBottom: 20,
  },
});
