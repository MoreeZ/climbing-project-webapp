import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { io } from "socket.io-client";  // <-- import socket.io-client
import configData from "../config.json";
import { useRouter } from "expo-router";
import { useVideo } from "../store/VideoDataProvider"; // Adjust path if needed

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0); // Track the progress of "processing progress"

  const router = useRouter();
  const { dispatch } = useVideo();
  
  // Keep socket reference so we can disconnect on unmount
  const socketRef = useRef<any>(null);
  const connectSocket = async () => {
    return new Promise((resolve, reject) => {
      // 1. Connect to the socket
      socketRef.current = io(configData.debugApiRootUrl);
  
      // 2. Handle successful connection
      socketRef.current.on("connect", () => {
        console.log("Socket connected. ID:", socketRef.current.id);
        resolve(socketRef.current.id);
      });
  
      // 3. Handle connection errors
      socketRef.current.on("connect_error", (error: any) => {
        console.error("Socket connection error:", error);
        reject(error); // Reject the promise with the error
      });
  
      // 4. Listen for server progress updates
      socketRef.current.on("processing progress", (percent: number) => {
        console.log("Processing progress:", percent);
        let progress = Math.round(percent * 100);
        setProgress(progress);
        if (progress === 100) {
          console.log("disconnecting socket")
          socketRef.current.disconnect();
        }
      });
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
    };
  }, [])

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        // User canceled the picker
        return;
      }

      // Expo’s DocumentPicker in some versions can return 
      // result.output or result.uri. Adjust logic as needed.
      setVideoFile(result.output?.[0] ?? null);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const uploadVideo = async () => {
    if (!videoFile) {
      Alert.alert("No video selected", "Please select a video to upload.");
      return;
    }
    
    setUploading(true);

    try {
      const socketId = await connectSocket();
      const uploadUrl =
      configData.debugApiRootUrl + "/vision-project/video-upload/" + socketId;
      console.log("Upload URL:", uploadUrl);

      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const responseData = await response.json();
      console.log("responseData:", responseData)
      if(responseData) {
        dispatch({
          type: "SET_VIDEOS",
          payload: responseData.result,
        });
        router.push("/analyze");
      } else {
        console.log("Error! Response data is in wrong format.", responseData)
      }

      // You could also toast/alert a success message here if desired
      // Alert.alert("Success", "Video uploaded successfully!");
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
        {videoFile ? (
          <Text style={styles.selectedVideoText}>
            Selected: {videoFile.name}
          </Text>
        ) : (
          <Text style={styles.noVideoText}>No video selected.</Text>
        )}

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Select Video" onPress={pickVideo} color="#0066cc" />
          </View>

          {uploading ? (
            <>
              <ActivityIndicator size="large" color="#0066cc" />
              {/* Show progress percentage while processing */}
              <Text style={{ marginTop: 10 }}>Processing: {progress}%</Text>
            </>
          ) : (
            <View style={styles.buttonWrapper}>
              <Button
                title="Upload Video"
                onPress={uploadVideo}
                color="#28a745"
                disabled={!videoFile}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Styling
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
