// app/(tabs)/schools.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface School {
  id: number;
  name: string;
  code: string;
  county: string;
  principal_name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
}

export default function SchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    county: "",
    principal_name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSchools([
        {
          id: 1,
          name: "Green Valley Primary",
          code: "GVP001",
          county: "Nairobi",
          principal_name: "John Kamau",
          phone: "0712345678",
          email: "info@greenvalley.ac.ke",
          status: "active",
        },
        {
          id: 2,
          name: "Sunrise Secondary",
          code: "SSC002",
          county: "Kiambu",
          principal_name: "Mary Wanjiku",
          phone: "0723456789",
          email: "admin@sunrise.ac.ke",
          status: "active",
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.code) {
      Alert.alert("Error", "School name and code are required");
      return;
    }

    if (editingSchool) {
      // Update existing school
      setSchools(
        schools.map((school) =>
          school.id === editingSchool.id ? { ...school, ...formData } : school
        )
      );
      Alert.alert("Success", "School updated successfully");
    } else {
      // Create new school
      const newSchool: School = {
        id: Date.now(),
        ...formData,
        status: "active",
      };
      setSchools([...schools, newSchool]);
      Alert.alert("Success", "School created successfully");
    }

    setModalVisible(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      county: "",
      principal_name: "",
      phone: "",
      email: "",
    });
    setEditingSchool(null);
  };

  const handleEdit = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code,
      county: school.county,
      principal_name: school.principal_name,
      phone: school.phone,
      email: school.email,
    });
    setModalVisible(true);
  };

  const handleDelete = (school: School) => {
    Alert.alert(
      "Delete School",
      `Are you sure you want to delete ${school.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSchools(schools.filter((s) => s.id !== school.id));
            Alert.alert("Success", "School deleted successfully");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Schools Management</Text>
     
        <Button
          title="Add School"
          onPress={() => setModalVisible(true)}
          leftIcon="add-outline"
          size="small"
          variant="secondary" // This will use green
        />
      </View>

      {/* Schools List */}
      <ScrollView style={styles.listContainer}>
        {schools.map((school) => (
          <View key={school.id} style={styles.schoolCard}>
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolCode}>Code: {school.code}</Text>
              <Text style={styles.schoolDetails}>County: {school.county}</Text>
              <Text style={styles.schoolDetails}>
                Principal: {school.principal_name}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      school.status === "active" ? "#4CAF50" : "#F44336",
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {school.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleEdit(school)}
                style={styles.actionButton}
              >
                <Ionicons name="create-outline" size={20} color="#2196F3" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(school)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
                <Text style={styles.label}>School Code *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.code}
                  onChangeText={(text) =>
                    setFormData({ ...formData, code: text })
                  }
                  placeholder="Enter school code"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>County</Text>
                <TextInput
                  style={styles.input}
                  value={formData.county}
                  onChangeText={(text) =>
                    setFormData({ ...formData, county: text })
                  }
                  placeholder="Enter county"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Principal Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.principal_name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, principal_name: text })
                  }
                  placeholder="Enter principal name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
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
                  style={styles.cancelButton}
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  listContainer: {
    flex: 1,
    padding: spacing.lg,
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
  schoolCode: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  schoolDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  cancelButton: {
    marginRight: spacing.md,
  },
});
