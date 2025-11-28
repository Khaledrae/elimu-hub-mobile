// app/(tabs)/classes.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import classService, { ClassModel } from "@/src/services/classService";
import { showConfirmation, showError, showSuccess } from "@/src/utils/alerts";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Manager {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export default function ClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    level_group: "",
    manager_id: "",
  });

  // Level group options
  const levelGroups = [
    { label: "Select level group...", value: "" },
    { label: "Pre-Primary", value: "pre-primary" },
    { label: "Lower Primary (1-3)", value: "lower-primary" },
    { label: "Upper Primary (4-6)", value: "upper-primary" },
    { label: "Lower Secondary (7-9)", value: "lower-secondary" },
    { label: "Upper Secondary (10-12)", value: "upper-secondary" },
  ];

  useEffect(() => {
    loadClasses();
    loadManagers();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const classesData = await classService.getAllClasses();
      setClasses(classesData);
      console.log("Loaded classes:", classesData);
    } catch (error: any) {
      console.error("Failed to load classes:", error);
      showError("Error", "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const loadManagers = async () => {
    try {
      const managersData = await classService.getAvailableManagers();
      setManagers(managersData);
    } catch (error) {
      console.error("Failed to load managers:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.level_group) {
      showError("Error", "Class name and level group are required");
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        level_group: formData.level_group,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
      };

      if (editingClass) {
        await classService.updateClass(editingClass.id, submitData);
        showSuccess("Success", "Class updated successfully");
      } else {
        await classService.createClass(submitData);
        showSuccess("Success", "Class created successfully");
      }
      
      setModalVisible(false);
      resetForm();
      loadClasses();
    } catch (error: any) {
      console.error("Class operation failed:", error);
      showError("Error", error.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      level_group: "",
      manager_id: "",
    });
    setEditingClass(null);
  };

  const handleEdit = (classItem: ClassModel) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || "",
      level_group: classItem.level_group || "",
      manager_id: classItem.manager_id?.toString() || "",
    });
    setModalVisible(true);
  };

  const handleDelete = async (classItem: ClassModel) => {
    showConfirmation(
      "Delete Class",
      `Are you sure you want to delete ${classItem.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await classService.deleteClass(classItem.id);
              showSuccess("Success", "Class deleted successfully");
              loadClasses();
            } catch (error: any) {
              console.error("Delete failed:", error);
              showError("Error", error.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  const handleClassPress = (classItem: ClassModel) => {
    router.push({
      pathname: "/class-details",
      params: { classId: classItem.id.toString() }
    } as any);
  };

  const getManagerName = (classItem: ClassModel) => {
    if (classItem.manager) {
      return `${classItem.manager.first_name} ${classItem.manager.last_name}`;
    }
    return "No manager assigned";
  };

  const getLevelGroupLabel = (levelGroup: string) => {
    const group = levelGroups.find(g => g.value === levelGroup);
    return group?.label || levelGroup;
  };

  return (
    <View style={styles.container}>
      {/* Header with Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Classes Management</Text>
        </View>
        
        <Button
          title="Add Class"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
          size="small"
          variant="secondary"
        />
      </View>

      {/* Classes List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading classes...</Text>
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color={colors.neutral.gray400} />
            <Text style={styles.emptyText}>No classes found</Text>
            <Text style={styles.emptySubtext}>Add your first class to get started</Text>
          </View>
        ) : (
          classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
              onPress={() => handleClassPress(classItem)}
              activeOpacity={0.7}
            >
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classDetails}>
                  Level: {getLevelGroupLabel(classItem.level_group)}
                </Text>
                <Text style={styles.classDetails}>
                  Manager: {getManagerName(classItem)}
                </Text>
                
                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.statText}>
                      {classItem.student_count || 0} students
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="book-outline" size={14} color={colors.text.secondary} />
                    <Text style={styles.statText}>
                      {classItem.course_count || 0} courses
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: classItem.status === 'inactive' ? "#F44336" : "#4CAF50",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {(classItem.status || 'active').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(classItem);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(classItem);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#F44336" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingClass ? "Edit Class" : "Add New Class"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Class Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="e.g., Grade 5A, Form 2B"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Level Group *</Text>
                <Picker
                  selectedValue={formData.level_group}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level_group: value })
                  }
                  style={styles.picker}
                >
                  {levelGroups.map((group) => (
                    <Picker.Item 
                      key={group.value} 
                      label={group.label} 
                      value={group.value} 
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Class Manager</Text>
                <Picker
                  selectedValue={formData.manager_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, manager_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select manager..." value="" />
                  {managers.map((manager) => (
                    <Picker.Item 
                      key={manager.id} 
                      label={`${manager.first_name} ${manager.last_name}`} 
                      value={manager.id.toString()} 
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  variant="ghost"
                />
                <Button
                  title={editingClass ? "Update Class" : "Create Class"}
                  onPress={handleSubmit}
                  variant="primary"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  classCard: {
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
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  classDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.md,
  },
  statText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginLeft: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: spacing.xs,
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
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.neutral.white,
    borderRadius: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  form: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.base,
    backgroundColor: colors.neutral.white,
  },
  picker: {
    borderWidth: 1,
    borderColor: colors.neutral.gray300,
    borderRadius: 8,
    backgroundColor: colors.neutral.white,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
});