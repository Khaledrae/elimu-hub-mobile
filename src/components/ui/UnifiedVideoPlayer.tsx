// components/UnifiedVideoPlayer.tsx
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Video from "react-native-video";
import YoutubePlayer from "react-native-youtube-iframe";

const { width, height } = Dimensions.get("window");

interface UnifiedVideoPlayerProps {
  visible: boolean;
  videoUrl: string;
  onClose: () => void;
}

const UnifiedVideoPlayer = ({
  visible,
  videoUrl,
  onClose,
}: UnifiedVideoPlayerProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(true);

  const isYouTubeUrl = (url: string) => {
    return (
      url &&
      (url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("youtube-nocookie.com") ||
        url.includes("m.youtube.com"))
    );
  };

  const extractYouTubeId = (url: string) => {
    if (!url) return null;

    if (url.includes("youtu.be")) {
      const parts = url.split("/");
      const id = parts[parts.length - 1].split("?")[0];
      return id;
    }

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTube = isYouTubeUrl(videoUrl);
  const youTubeId = isYouTube ? extractYouTubeId(videoUrl) : null;

  const handleOpenInBrowser = () => {
    if (videoUrl) {
      Linking.openURL(videoUrl);
    }
    onClose();
  };

  const onReady = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    setPlaying(true);
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
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
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
              <Text style={styles.loadingText}>
                {isYouTube ? "Loading YouTube video..." : "Loading video..."}
              </Text>
            </View>
          )}

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="white" />
              <Text style={styles.errorTitle}>Playback Error</Text>
              <Text style={styles.errorMessage}>
                {isYouTube
                  ? "Unable to play this YouTube video."
                  : "Unable to play this video. It may be in an unsupported format."}
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
            <>
              {isYouTube && youTubeId ? (
                Platform.OS === "web" ? (
                  <iframe
                    width="100%"
                    height="400"
                    src={`https://www.youtube.com/embed/${youTubeId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ opacity: loading ? 0 : 1 }}
                    onLoad={() => {
                      setLoading(false);
                      setError(false);
                    }}
                  />
                ) : (
                  <YoutubePlayer
                    height={height * 0.4}
                    width={width}
                    videoId={youTubeId}
                    play={playing}
                    onReady={onReady}
                    onError={onError}
                  />
                )
              ) : (
                // Direct Video Player
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
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
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
    alignItems: "center",
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

export default UnifiedVideoPlayer;
