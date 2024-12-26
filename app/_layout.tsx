import React from "react";
import { Drawer } from "expo-router/drawer";
import { VideoDataProvider } from "@/store/VideoDataProvider";

export default function RootLayout() {
  return (
    <VideoDataProvider>
      <Drawer
        initialRouteName="home"
        screenOptions={{
          headerStyle: { backgroundColor: "#f4511e" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Drawer.Screen name="home" options={{ title: "Home" }} />
        <Drawer.Screen name="upload" options={{ title: "Upload" }} />
        <Drawer.Screen name="analyze" options={{ title: "Analysis" }} />
      </Drawer>
    </VideoDataProvider>
  );
}
