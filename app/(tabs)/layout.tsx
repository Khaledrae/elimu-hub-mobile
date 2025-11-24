// app/(tabs)/_layout.tsx
import { colors } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.yellow,
        tabBarInactiveTintColor: colors.neutral.gray500,
        tabBarStyle: {
          backgroundColor: colors.neutral.white,
          borderTopWidth: 1,
          borderTopColor: colors.neutral.gray200,
        },
        headerStyle: {
          backgroundColor: colors.primary.yellow,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schools"
        options={{
          title: "Schools",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: "Classes",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="school-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="lessons"
        options={{
          title: "Lessons",
          tabBarIcon: ({ size, color }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
