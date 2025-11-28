// app/(tabs)/schools.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import authService from "@/src/services/authService";
import schoolService, { School } from "@/src/services/schoolService";
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

interface County {
  id: number;
  name: string;
}

export default function SchoolsScreen() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    county_id: "",
  });

  useEffect(() => {
    loadSchools();
    loadCounties();
  }, []);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const schoolsData = await schoolService.getAllSchools();
      // For each school, load admin info if needed
      const schoolsWithAdmin = await Promise.all(
        schoolsData.map(async (school) => {
          try {
            const admin = await schoolService.getSchoolAdmin(school.id);
            return { ...school, admin };
          } catch (error) {
            return school; // Return school without admin if fetch fails
          }
        })
      );
      setSchools(schoolsWithAdmin);
    } catch (error: any) {
      console.error("Failed to load schools:", error);
      showError("Error", "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  const loadCounties = async () => {
    try {
      const countiesData = await authService.getCounties();
      setCounties(countiesData);
    } catch (error) {
      console.error("Failed to load counties:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showError("Error", "School name is required");
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        address: formData.address,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        county_id: formData.county_id ? parseInt(formData.county_id) : undefined,
      };

      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, submitData);
        showSuccess("Success", "School updated successfully");
      } else {
        await schoolService.createSchool(submitData);
        showSuccess("Success", "School created successfully");
      }
      
      setModalVisible(false);
      resetForm();
      loadSchools();
    } catch (error: any) {
      console.error("School operation failed:", error);
      showError("Error", error.message || "Operation failed");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      contact_email: "",
      contact_phone: "",
      county_id: "",
    });
    setEditingSchool(null);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name || "",
      address: school.address || "",
      contact_email: school.contact_email || "",
      contact_phone: school.contact_phone || "",
      county_id: school.county_id?.toString() || "",
    });
    setModalVisible(true);
  };

  const handleDelete = async (school: School) => {
    showConfirmation(
      "Delete School",
      `Are you sure you want to delete ${school.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await schoolService.deleteSchool(school.id);
              showSuccess("Success", "School deleted successfully");
              loadSchools();
            } catch (error: any) {
              console.error("Delete failed:", error);
              showError("Error", error.message || "Delete failed");
            }
          },
        },
      ]
    );
  };

  const handleSchoolPress = (school: School) => {
    router.push({
      pathname: "/school-details",
      params: { schoolId: school.id.toString() }
    } as any);
  };

  const getAdminName = (school: School) => {
    if (school.admin?.user) {
      return `${school.admin.user.first_name} ${school.admin.user.last_name}`;
    }
    return "No admin assigned";
  };

  const getCountyName = (school: School) => {
    if (school.county) {
      return school.county.name;
    }
    if (school.county_id) {
      const county = counties.find(c => c.id === school.county_id);
      return county?.name || "Unknown county";
    }
    return "No county";
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
          <Text style={styles.title}>Schools Management</Text>
        </View>
        
        <Button
          title="Add School"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
          size="small"
          variant="secondary"
        />
      </View>

      {/* Schools List */}
      <ScrollView style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading schools...</Text>
          </View>
        ) : schools.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.neutral.gray400} />
            <Text style={styles.emptyText}>No schools found</Text>
            <Text style={styles.emptySubtext}>Add your first school to get started</Text>
          </View>
        ) : (
          schools.map((school) => (
            <TouchableOpacity
              key={school.id}
              style={styles.schoolCard}
              onPress={() => handleSchoolPress(school)}
              activeOpacity={0.7}
            >
              <View style={styles.schoolInfo}>
                <Text style={styles.schoolName}>{school.name}</Text>
                <Text style={styles.schoolDetails}>County: {getCountyName(school)}</Text>
                <Text style={styles.schoolDetails}>Admin: {getAdminName(school)}</Text>
                {school.contact_phone && (
                  <Text style={styles.schoolDetails}>Phone: {school.contact_phone}</Text>
                )}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: school.status === 'inactive' ? "#F44336" : "#4CAF50",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {(school.status || 'active').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEdit(school);
                  }}
                  style={styles.actionButton}
                >
                  <Ionicons name="create-outline" size={20} color="#2196F3" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(school);
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
                {editingSchool ? "Edit School" : "Add New School"}
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
                <Text style={styles.label}>School Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter school name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>County</Text>
                <Picker
                  selectedValue={formData.county_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, county_id: value })
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Select county..." value="" />
                  {counties.map((county) => (
                    <Picker.Item 
                      key={county.id} 
                      label={county.name} 
                      value={county.id.toString()} 
                    />
                  ))}
                </Picker>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) =>
                    setFormData({ ...formData, address: text })
                  }
                  placeholder="Enter school address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact_phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact_phone: text })
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contact_email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, contact_email: text })
                  }
                  placeholder="Enter email"
                  keyboardType="email-address"
                />
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
                  title={editingSchool ? "Update School" : "Create School"}
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
  schoolCard: {
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
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  schoolDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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