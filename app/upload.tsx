import React, { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import configData from "../config.json";
import { useRouter } from "expo-router";
import { useVideo, VideoItem } from "../store/VideoDataProvider"; // Adjust path if needed

export default function UploadScreen() {
  const [uploadingStage, setUploadingStage] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0); // Track the progress of "processing progress"
  const [error, setError] = useState<string | null>(null); // State to track error messages

  const router = useRouter();
  const { dispatch } = useVideo();

  const startPolling = async (jobId: string) => {
    setProgress(0);
    return new Promise<VideoItem[]>((resolve, reject) => {
      let interval: NodeJS.Timeout;

      const pollJobStatus = async () => {
        try {
          const response = await fetch(
            `https://services.oskarmroz.com/indoor-climbing/get-job/${jobId}`
          );
          const data = await response.json();

          setProgress(data["processing_progress"]);

          if (data.status === "completed") {
            const videosResponse = await fetch(
              `https://services.oskarmroz.com/indoor-climbing/get-videos-from-owner?owner=${data.owner}`
            );
            const videosList = await videosResponse.json();
            clearInterval(interval);
            resolve(videosList);
          }
        } catch (error) {
          console.error("Error polling job status:", error);
          clearInterval(interval);
          reject(error);
        }
      };

      interval = setInterval(pollJobStatus, 5000);
    });
  };

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setVideoFile(result.output?.[0] ?? null);
    } catch (error: any) {
      setError(`Error selecting video: ${error.message}`);
    }
  };

  const checkServerCache = async (videoName: string) => {
    const videosResponse = await fetch(
      `https://services.oskarmroz.com/indoor-climbing/get-videos-from-owner?owner=${videoName}`
    );
    try {
      const data = await videosResponse.json();
      if (data.length > 0) {
        dispatch({
          type: "SET_VIDEOS",
          payload: data,
        });
        setUploadingStage(null);
        router.push("/analyze");
      }
    } catch (error: any) {
      console.log("Failed to access server filesystem cache.", error);
    }
  };

  const uploadVideo = async () => {
    if (!videoFile) {
      setError("No video selected. Please select a video to upload.");
      return;
    }

    setUploadingStage("Uploading");
    setError(null); // Reset the error state

    let fakeProgressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(fakeProgressInterval);
          return 100; // Cap the progress at 100%
        }
        return prevProgress + 1; // Increment progress by 1%
      });
    }, 300);

    try {
      dispatch({
        type: "RESET_VIDEOS",
      });

      await checkServerCache(videoFile.name);

      const uploadUrl =
        configData.apiRootUrl + configData.serverCustomPath + "video-upload";

      const formData = new FormData();
      formData.append("video", videoFile);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      // Once the response is received, clear the interval
      clearInterval(fakeProgressInterval);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const responseData = await response.json();
      if (responseData["already_processed"]) {
        dispatch({
          type: "SET_VIDEOS",
          payload: responseData["data"],
        });
        router.push("/analyze");
      } else {
        setUploadingStage("Processing");
        const pollingResult = await startPolling(responseData["job_id"]);
        if (pollingResult) {
          dispatch({
            type: "SET_VIDEOS",
            payload: pollingResult,
          });
          router.push("/analyze");
        }
      }
    } catch (error: any) {
      setError(`Upload Error: ${error.message}`);
    } finally {
      setUploadingStage(null);
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

          {uploadingStage ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={{
                    ...styles.progressIndicator,
                    width: `${progress}%`,
                  }}
                />
              </View>
              <Text style={styles.progressText}>
                {uploadingStage === "Uploading"
                  ? uploadingStage
                  : uploadingStage + `: ${progress}%`}
              </Text>
            </View>
          ) : (
            <View style={styles.buttonWrapper}>
              <Button
                title="Upload Video"
                onPress={uploadVideo}
                color="#28a745"
                disabled={!videoFile || uploadingStage != null}
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
    boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)",
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
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  progressBar: {
    width: "100%",
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressIndicator: {
    height: "100%",
    backgroundColor: "#00cc66",
  },
  progressText: {
    fontSize: 14,
    color: "#333",
  },
});
