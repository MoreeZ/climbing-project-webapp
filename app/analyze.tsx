import React, { LegacyRef, useEffect, useState } from "react";
import { AVPlaybackSource, AVPlaybackStatusError, AVPlaybackStatusSuccess, AVPlaybackStatusToSet, ResizeMode, Video, VideoProps } from 'expo-av';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Button } from "react-native";

// Import the custom hook from your provider
import { useVideo, VideoEvent } from "../store/VideoDataProvider"; // Adjust path as needed

export default function AnalyzeScreen() {
  const {
    state: { videos },
  } = useVideo();

  const videosRef = React.useRef<Video[] | null[]>([]);
  const [videoStates, setVideoStates] = useState<(AVPlaybackStatusSuccess | AVPlaybackStatusError)[]>([]);
  const [activeLimb, setActiveLimb] = useState<string | null>(null);
  const [activeHold, setActiveHold] = useState<string | null>(null);
  const [sortedEventsByLimb, setSortedEventsByLimb] = useState(new Map<string, string[]>());

  useEffect(() => {
    console.log("videos:", videos)
    const limbMap = new Map<string, string[]>();
    videos && videos.forEach((vid) => {
      vid.events.forEach(event => {
        console.log("===============================================")
        console.log("event:", event)
        console.log("limbMap after:", limbMap)
        console.log("limbMap.has(event.limb):", limbMap.has(event.limb))
        if (limbMap.has(event.limb)) {
          if(!limbMap.get(event.limb)?.includes(event.hold)) {
            limbMap.set(event.limb, [...limbMap.get(event.limb)!, event.hold]);
          }
        }
        else {
          if(event.limb) {
            limbMap.set(event.limb, [event.hold]);
          }
        }
        console.log("limbMap after:", limbMap)
      })
    })
    const availableLimbs = Array.from(limbMap.keys());
    if (availableLimbs.length > 0) {
      setActiveLimb(availableLimbs[0])
    }
    setSortedEventsByLimb(limbMap);
  }, [videos])

  useEffect(() => {
    // Navigate to selected hold and limb in each video
    videosRef.current.forEach((video, index) => {
      if (videoStates && videoStates[index] && !videoStates[index].isLoaded) return;
      const timestamp = findTimestamp(index, activeLimb!, activeHold!);
      if (timestamp) {
        video?.setPositionAsync((timestamp * 1000));
      }
      else {
        video?.setPositionAsync(0);
      }
    })
  }, [activeHold, activeLimb])

  const findTimestamp = (videoIndex: number, limb: string, hold: string) => {
    if (!videos[videoIndex]) return null;
    if (!limb || !hold) return null;
    const timestamp = videos[videoIndex].events.find(event => event.limb === limb && event.hold === hold)?.timestamp;
    return timestamp || null;
  }

  const handleSetVideoStatus = (index: number, newState: AVPlaybackStatusSuccess | AVPlaybackStatusError) => {
    setVideoStates([...videoStates.slice(0, index), newState, ...videoStates.slice(index + 1)])
  }

  const renderHoldButtons = () => {
    if (!activeLimb) return <View></View>
    return <View style={styles.buttonsContainer}>
      {activeLimb && sortedEventsByLimb.has(activeLimb) && sortedEventsByLimb.get(activeLimb)!.map((holdStr, index) => (
        <View key={index} style={styles.eachButton}>
          <Button title={holdStr} onPress={() => {
            setActiveHold(holdStr);
          }} color={activeHold === holdStr ? "#28a745" : "#0066cc"} />
        </View>
      ))}
    </View>
  }

  const renderLimbButtons = () => {
    return <View style={styles.buttonsContainer}>
      {Array.from(sortedEventsByLimb.keys()).map((limbStr: string, index) => (
        <View key={index} style={styles.eachButton}>
          <Button title={limbStr} onPress={() => { setActiveLimb(limbStr); setActiveHold(null) }} color={activeLimb === limbStr ? "#28a745" : "#0066cc"} />
        </View>
      ))}
    </View>
  }

  // If no videos, show a fallback
  if (!videos || videos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noVideosText}>No videos to display</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.limbNavContainer}>
        <Text style={styles.navigationText}>Limbs</Text>
        {renderLimbButtons()}
      </View>
      <View style={styles.limbNavContainer}>
        <Text style={styles.navigationText}>Holds</Text>
        {renderHoldButtons()}
      </View>

      <ScrollView style={styles.videoContainer} horizontal showsHorizontalScrollIndicator={false}>
        {videos && videos.map((vid, index) =>
          <View key={index}>
            <Text style={styles.navigationText}>Video {index + 1}</Text>
            <Video
              key={index}
              ref={(ref) => (videosRef.current[index] = ref)}
              style={styles.video}
              source={{ uri: vid.videoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isMuted
              onPlaybackStatusUpdate={(newStatus) => handleSetVideoStatus(index, newStatus)}
              videoStyle={Platform.OS === 'web' ? { position: 'relative' } : undefined}

            />
          </View>
        )}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  limbNavContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  buttonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  eachButton: {
    margin: 5,
    padding: 5
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
    marginRight: 10,
    backgroundColor: "rgba(0,0,0,1)",
    height: 600,
    width: 337.5,
    resizeMode: "contain",
    alignItems: "center",
    justifyContent: "center",
  },
  noVideosText: {
    flex: 1,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 16,
    color: "#888",
  },
  findError: {

  },
});
