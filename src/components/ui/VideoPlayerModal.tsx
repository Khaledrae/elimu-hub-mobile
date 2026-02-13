// components/VideoPlayerModal.tsx
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Video from "react-native-video";
import { WebView } from "react-native-webview";

const { width, height } = Dimensions.get("window");

const VideoPlayerModal = ({ visible, videoUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [useWebView, setUseWebView] = useState(false);

  const isYouTubeUrl = (url) => {
    return (
      url &&
      (url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("youtube-nocookie.com"))
    );
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;

    // Handle youtu.be format
    if (url.includes("youtu.be")) {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0];
    }

    // Handle youtube.com format
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&controls=1&modestbranding=1&playsinline=1&showinfo=0`;
  };

  const isYouTube = isYouTubeUrl(videoUrl);
  const youTubeId = isYouTube ? extractYouTubeId(videoUrl) : null;

  const handleOpenInBrowser = () => {
    if (videoUrl) {
      Linking.openURL(videoUrl);
    }
    onClose();
  };

  const handleRetry = () => {
    setError(false);
    setLoading(true);
  };

  if (!videoUrl) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.videoModal}>
        {/* Header with controls */}
        <View style={styles.videoHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.browserButton}
            onPress={handleOpenInBrowser}
          >
            <Ionicons name="open-outline" size={20} color="white" />
            <Text style={styles.browserButtonText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>

        {/* Video Container */}
        <View style={styles.videoContainer}>
          {isYouTube && youTubeId ? (
            // YouTube WebView
            <>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary.yellow}
                  />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              <WebView
                key={youTubeId}
                source={{ uri: getYouTubeEmbedUrl(youTubeId) }}
                style={styles.webView}
                containerStyle={styles.webViewContainer}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState={false}
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                  setUseWebView(false);
                }}
              />
            </>
          ) : (
            // Direct video player
            <>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator
                    size="large"
                    color={colors.primary.yellow}
                  />
                  <Text style={styles.loadingText}>Loading video...</Text>
                </View>
              )}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color="white"
                  />
                  <Text style={styles.errorTitle}>Playback Error</Text>
                  <Text style={styles.errorMessage}>
                    Unable to play this video. It may be in an unsupported
                    format.
                  </Text>
                  <View style={styles.errorActions}>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRetry}
                    >
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.browserRetryButton}
                      onPress={handleOpenInBrowser}
                    >
                      <Text style={styles.browserRetryButtonText}>
                        Open in Browser
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Video
                  source={{ uri: videoUrl }}
                  style={styles.videoPlayer}
                  controls={true}
                  resizeMode="contain"
                  paused={false}
                  repeat={false}
                  onLoad={() => setLoading(false)}
                  onLoadStart={() => setLoading(true)}
                  onError={(err) => {
                    console.error("Video error:", err);
                    setLoading(false);
                    setError(true);
                  }}
                  bufferConfig={{
                    minBufferMs: 15000,
                    maxBufferMs: 50000,
                    bufferForPlaybackMs: 2500,
                    bufferForPlaybackAfterRebufferMs: 5000,
                  }}
                />
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  videoModal: {
    flex: 1,
    backgroundColor: "black",
  },
  videoHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  browserButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    gap: spacing.xs,
  },
  browserButtonText: {
    color: "white",
    fontSize: fontSize.sm,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "black",
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  webView: {
    flex: 1,
    backgroundColor: "black",
  },
  videoPlayer: {
    width: width,
    height: height,
    backgroundColor: "black",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
    zIndex: 100,
  },
  loadingText: {
    color: "white",
    marginTop: spacing.md,
    fontSize: fontSize.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: "black",
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: "white",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: fontSize.base,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  errorActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.yellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.neutral.black,
    fontWeight: fontWeight.bold,
  },
  browserRetryButton: {
    backgroundColor: "transparent",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "white",
  },
  browserRetryButtonText: {
    color: "white",
    fontWeight: fontWeight.bold,
  },
});

export default VideoPlayerModal;
