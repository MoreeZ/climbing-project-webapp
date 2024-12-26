// store/VideoDataProvider.tsx

import React, {
    createContext,
    useReducer,
    useContext,
    Dispatch,
    ReactNode,
  } from "react";
  
  /**
   * Define the shape of an event in the video.
   */
  type VideoEvent = {
    limb: string;
    hold: string;
    timestamp: number;
  };
  
  /**
   * Each video object has a URL and an array of events.
   */
  type VideoItem = {
    videoUrl: string;
    events: VideoEvent[];
  };
  
  /**
   * The global state keeps an array of these video objects.
   */
  type VideoState = {
    videos: VideoItem[];
  };
  
  /**
   * Define the possible actions that can modify the state.
   */
  type Action =
    | { type: "ADD_VIDEO"; payload: VideoItem }
    | { type: "REMOVE_VIDEO"; payload: string }; // We'll remove videos by videoUrl.
  
  /**
   * Reducer function to handle actions and update state accordingly.
   */
  function videoReducer(state: VideoState, action: Action): VideoState {
    switch (action.type) {
      case "ADD_VIDEO":
        return {
          ...state,
          videos: [...state.videos, action.payload],
        };
      case "REMOVE_VIDEO":
        return {
          ...state,
          videos: state.videos.filter(
            (item) => item.videoUrl !== action.payload
          ),
        };
      default:
        return state;
    }
  }
  
  /**
   * Create a context that holds our state and dispatch.
   */
  const VideoContext = createContext<{
    state: VideoState;
    dispatch: Dispatch<Action>;
  } | null>(null);
  
  /**
   * Provide our global state to all children.
   */
  export function VideoDataProvider({ children }: { children: ReactNode }) {
    // Initialize the array of videos as empty or with sample data if you prefer
    const initialState: VideoState = {
      videos: [],
    };
  
    const [state, dispatch] = useReducer(videoReducer, initialState);
  
    return (
      <VideoContext.Provider value={{ state, dispatch }}>
        {children}
      </VideoContext.Provider>
    );
  }
  
  /**
   * Custom hook to use our VideoContext.
   */
  export function useVideo() {
    const context = useContext(VideoContext);
    if (!context) {
      throw new Error("useVideo must be used within a VideoDataProvider");
    }
    return context;
  }
  