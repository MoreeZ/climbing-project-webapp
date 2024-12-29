import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { io } from "socket.io-client"; // <-- import socket.io-client
import configData from "../config.json";
import { useRouter } from "expo-router";
import { useVideo } from "../store/VideoDataProvider"; // Adjust path if needed

export default function UploadScreen() {
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0); // Track the progress of "processing progress"
  const [error, setError] = useState<string | null>(null); // State to track error messages

  const router = useRouter();
  const { dispatch } = useVideo();

  const socketRef = useRef<any>(null);
  const connectSocket = async () => {
    return new Promise((resolve, reject) => {
      socketRef.current = io(configData.apiRootUrl, {
        path: configData.serverCustomPath
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected. ID:", socketRef.current.id);
        resolve(socketRef.current.id);
      });

      socketRef.current.on("disconnect", () => {
        console.log("Socket disconnected. ID:", socketRef.current.id);
      });

      socketRef.current.on("connect_error", (error: any) => {
        console.error("Socket connection error:", error);
        reject(error); // Reject the promise with the error
      });

      socketRef.current.on("processing progress", (percent: number) => {
        let progress = Math.round(percent * 100);
        setProgress(progress);
        if (progress === 100) {
          console.log("disconnecting socket");
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
  }, []);

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
      setError(`Error selecting video: ${error.message}`);
    }
  };

  const uploadVideo = async () => {
    if (!videoFile) {
      setError("No video selected. Please select a video to upload.");
      return;
    }

    setUploading(true);
    setError(null); // Reset the error state

    try {
      dispatch({
        type: "RESET_VIDEOS",
      });
      // const socketId = await connectSocket();
      const uploadUrl =
        configData.apiRootUrl + configData.serverCustomPath + "video-upload/" + "socketId";

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
      if (responseData) {
        dispatch({
          type: "SET_VIDEOS",
          payload: responseData.result,
        });
        router.push("/analyze");
      } else {
        console.log("Error! Response data is in wrong format.", responseData);
      }
    } catch (error: any) {
      setError(`Upload Error: ${error.message}`);
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

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Select Video" onPress={pickVideo} color="#0066cc" />
          </View>

          {uploading ? (
            <>
              <ActivityIndicator size="large" color="#0066cc" />
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
    boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)"
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
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
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
