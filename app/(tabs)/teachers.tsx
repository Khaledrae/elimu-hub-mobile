// app/(tabs)/teachers.tsx
import { colors } from "@/src/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function TeachersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Redirect to users page with teacher filter
    router.replace({
      pathname: "/users",
      params: { initialFilter: 'teacher', ...params }
    } as any);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary.yellow} />
      <Text style={{ marginTop: 10 }}>Redirecting to teachers...</Text>
    </View>
  );
}