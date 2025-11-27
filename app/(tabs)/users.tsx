// app/(tabs)/users.tsx
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import userService, { User } from "@/src/services/userService";
import { showConfirmation, showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function UsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useLocalSearchParams();
  
  const userTypes = [
    { label: "All Users", value: "all" },
    { label: "Teachers", value: "teacher" },
    { label: "Students", value: "student" },
    { label: "Parents", value: "parent" },
    { label: "Admins", value: "admin" },
  ];
  
  const [userType, setUserType] = useState<
    "all" | "teacher" | "student" | "parent" | "admin"
  >((params.initialFilter as any) || "all");

  useEffect(() => {
    loadUsers();
  }, [userType]); // Reload when filter changes

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Pass the filter to the backend
      const usersData = await userService.getAllUsers(userType);
      setUsers(usersData || []); // Ensure we always have an array
      console.log("Loaded users:", usersData);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      showError("Error", error.message || "Failed to load users");
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    showConfirmation(
      "Delete User",
      `Are you sure you want to delete ${user.first_name} ${user.last_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await userService.deleteUser(user.id);
              showSuccess("Success", "User deleted successfully");
              loadUsers(); // Refresh the list
            } catch (error: any) {
              console.error("Delete failed:", error);
              showError("Error", error.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  // Safe function to get avatar text
  const getAvatarText = (user: User) => {
    const firstChar = user.first_name?.[0] || '';
    const lastChar = user.last_name?.[0] || '';
    return `${firstChar}${lastChar}`.toUpperCase() || 'U';
  };

  // Safe function to get full name
  const getFullName = (user: User) => {
    const firstName = user.first_name || 'Unknown';
    const lastName = user.last_name || 'User';
    return `${firstName} ${lastName}`;
  };

  const getUserRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "#F44336";
      case "teacher":
        return "#2196F3";
      case "student":
        return "#4CAF50";
      case "parent":
        return "#FF9800";
      default:
        return "#9E9E9E";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "#4CAF50" : "#F44336";
  };

  const canManageUsers = currentUser?.role === "admin";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>User Management</Text>
        </View>
      </View>

      {/* User Type Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filter by Role:</Text>
        <Picker
          selectedValue={userType}
          onValueChange={(value) => setUserType(value)}
          style={styles.picker}
        >
          {userTypes.map((type) => (
            <Picker.Item
              key={type.value}
              label={type.label}
              value={type.value}
            />
          ))}
        </Picker>
      </View>

      {/* Users List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading users...</Text>
          </View>
        ) : !users || users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={64}
              color={colors.neutral.gray400}
            />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              {userType === "all"
                ? "No users in the system"
                : `No ${userType}s found`}
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarText}>
                  {getAvatarText(user)}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {getFullName(user)}
                </Text>
                <Text style={styles.userEmail}>{user.email || 'No email'}</Text>
                {user.phone && (
                  <Text style={styles.userPhone}>{user.phone}</Text>
                )}

                <View style={styles.userMeta}>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: getUserRoleColor(user.role) + "20" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleText,
                        { color: getUserRoleColor(user.role) },
                      ]}
                    >
                      {(user.role || 'unknown').toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(user.status || 'active') },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {(user.status || 'active').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {canManageUsers && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleDelete(user)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.neutral.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  filterLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginRight: spacing.md,
  },
  picker: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    backgroundColor: colors.neutral.white,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  userCard: {
    flexDirection: "row",
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  userMeta: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral.white,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
});