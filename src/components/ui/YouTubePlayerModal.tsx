// components/YouTubePlayerModal.tsx
import { colors, fontSize, spacing } from "@/src/constants/theme";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import YoutubePlayer from "react-native-youtube-iframe";

const { width, height } = Dimensions.get("window");

const YouTubePlayerModal = ({ visible, videoUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(true);

  const extractYouTubeId = (url) => {
    if (!url) return null;

    if (url.includes("youtu.be")) {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0];
    }

    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = extractYouTubeId(videoUrl);

  const onReady = useCallback(() => {
    setLoading(false);
  }, []);

  const onError = useCallback(() => {
    setLoading(false);
    // Fallback to browser
    // ... handle error
  }, []);

  if (!videoId) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.videoWrapper}>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
              <Text style={styles.loadingText}>Loading YouTube video...</Text>
            </View>
          )}

          <YoutubePlayer
            height={height * 0.4}
            width={width}
            videoId={videoId}
            play={playing}
            onChangeState={(state) => {
              if (state === "ended") {
                setPlaying(false);
              }
            }}
            onReady={onReady}
            onError={onError}
            webViewStyle={{ opacity: loading ? 0 : 1 }}
            webViewProps={{
              androidLayerType: Platform.OS === "android" ? "hardware" : "none",
            }}
          />
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
    justifyContent: "flex-end",
    padding: spacing.md,
    paddingTop: spacing.xl,
    zIndex: 1000,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  videoWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
});

export default YouTubePlayerModal;
