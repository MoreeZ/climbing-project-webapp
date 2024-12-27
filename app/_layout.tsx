import React from "react";
import { Drawer } from "expo-router/drawer";
import { VideoDataProvider } from "@/store/VideoDataProvider";

export default function RootLayout() {
  return (
    <VideoDataProvider>
      <Drawer
        initialRouteName="index"
        screenOptions={{
          headerStyle: { backgroundColor: "#f4511e" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          
        }}
      >
        <Drawer.Screen name="index" options={{ title: "Home" }} />
        <Drawer.Screen name="upload" options={{ title: "Upload" }} />
        <Drawer.Screen name="analyze" options={{ title: "Analysis" }} />
      </Drawer>
    </VideoDataProvider>
  );
}
