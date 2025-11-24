// app/school-details.tsx
import { Button } from "@/src/components/ui/Button";
import { colors, fontSize, fontWeight, spacing } from "@/src/constants/theme";
import schoolService from "@/src/services/schoolService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function SchoolDetailsScreen() {
  const router = useRouter();
  const { schoolId } = useLocalSearchParams();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      loadSchool();
    }
  }, [schoolId]);

  const loadSchool = async () => {
    try {
      const schoolData = await schoolService.getSchool(Number(schoolId));
      setSchool(schoolData);
    } catch (error) {
      console.error("Failed to load school:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!school) {
    return (
      <View style={styles.container}>
        <Text>School not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          title="Back"
          onPress={() => router.back()}
          leftIcon="arrow-back"
          variant="ghost"
          size="small"
        />
        <Text style={styles.title}>School Details</Text>
        <View style={{ width: 60 }} /> {/* Spacer for alignment */}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.schoolName}>{school.name}</Text>
          
          {school.code && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>School Code:</Text>
              <Text style={styles.detailValue}>{school.code}</Text>
            </View>
          )}
          
          {school.address && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{school.address}</Text>
            </View>
          )}
          
          {school.county && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>County:</Text>
              <Text style={styles.detailValue}>{school.county}</Text>
            </View>
          )}
          
          {school.principal_name && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Admin:</Text>
              <Text style={styles.detailValue}>{school.principal_name}</Text>
            </View>
          )}
          
          {school.contact_phone && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{school.contact_phone}</Text>
            </View>
          )}
          
          {school.contact_email && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{school.contact_email}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: school.status === 'inactive' ? '#F44336' : '#4CAF50' }
            ]}>
              <Text style={styles.statusText}>
                {(school.status || 'active').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <Button
              title="View Classes"
              onPress={() => console.log('Navigate to classes')}
              leftIcon="school-outline"
              variant="outline"
              fullWidth
            />
            <Button
              title="View Teachers"
              onPress={() => console.log('Navigate to teachers')}
              leftIcon="people-outline"
              variant="outline"
              fullWidth
            />
            <Button
              title="View Students"
              onPress={() => console.log('Navigate to students')}
              leftIcon="person-outline"
              variant="outline"
              fullWidth
            />
          </View>
        </View>
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.neutral.white,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  schoolName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray200,
  },
  detailLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  detailValue: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.neutral.white,
  },
  actionsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionButtons: {
    gap: spacing.md,
  },
});