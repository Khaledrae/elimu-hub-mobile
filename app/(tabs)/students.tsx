// app/(tabs)/students.tsx
import { colors } from "@/src/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function StudentsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Redirect to users page with student filter
    router.replace({
      pathname: "/users",
      params: { initialFilter: 'student', ...params }
    } as any);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary.yellow} />
      <Text style={{ marginTop: 10 }}>Redirecting to students...</Text>
    </View>
  );
}