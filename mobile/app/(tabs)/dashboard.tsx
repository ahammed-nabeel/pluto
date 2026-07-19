import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { colors, spacing, radius } from "../../src/theme";
import { fetchWithAuth } from "../../src/api";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetchWithAuth("/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Calculate dynamic stats from data
  const totalCards = data?.totalCards || 0;
  
  const formattedValue = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(data?.totalCardValue || 0);

  const openTasks = data?.tasksByStatus
    ?.filter((s: any) => s.status !== "completed")
    .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

  const overdueTasks = data?.overdueTasksCount || 0;

  const STATS = [
    { label: "Total Leads/Projects", value: totalCards.toString(), delta: "", color: colors.primary, bg: colors.primaryLight },
    { label: "Pipeline Value", value: formattedValue, delta: "", color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Open Tasks", value: openTasks.toString(), delta: "", color: "#059669", bg: "#ECFDF5" },
    { label: "Overdue Tasks", value: overdueTasks.toString(), delta: "", color: "#EF4444", bg: "#FEF2F2" },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📊  Dashboard</Text>
        <Text style={styles.pageSubtitle}>Overview of your workspace activity.</Text>
      </View>

      <ScrollView 
        style={styles.body} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              {/* Only show chip if we have a delta text, keeping design if needed */}
              {stat.delta ? (
                <View style={[styles.statChip, { backgroundColor: stat.bg }]}>
                  <Text style={[styles.statChipText, { color: stat.color }]}>{stat.delta}</Text>
                </View>
              ) : <View style={{ height: 20 }} />}
            </View>
          ))}
        </View>

        {/* Pipeline by List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pipeline by List</Text>
          {!data?.cardsByList || data.cardsByList.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyText}>Create lists in a board to see pipeline data</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {data.cardsByList.map((item: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listTitle}>{item.listTitle}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.listValue}>
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.value)}
                    </Text>
                    <Text style={styles.listCount}>{item.count} cards</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {!data?.recentActivity || data.recentActivity.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No recent activity found</Text>
            </View>
          ) : (
            data.recentActivity.map((item: any, i: number) => (
              <View key={i} style={[styles.activityItem, i < data.recentActivity.length - 1 && styles.activityBorder]}>
                <View style={styles.activityAvatar}>
                  <Text style={styles.activityAvatarText}>
                    {getInitials(item.performer?.name)}
                  </Text>
                </View>
                <View style={styles.activityBody}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityAction}>{item.action} </Text>
                    <Text style={styles.activityTarget}>"{item.card?.project_name || item.entity_type}"</Text>
                  </Text>
                  <Text style={styles.activityTime}>{new Date(item.timestamp).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Lead Metrics placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lead Status Priority</Text>
          {!data?.cardsByLabel || data.cardsByLabel.length === 0 ? (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyText}>Add labels to cards to see metrics</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {data.cardsByLabel.map((item: any, i: number) => (
                <View key={i} style={styles.listItem}>
                  <Text style={styles.listTitle}>{item.label}</Text>
                  <Text style={styles.listCount}>{item.count} cards</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: colors.textSecondary },
  body: { flex: 1, padding: spacing.md },

  // Stats
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    minWidth: "46%",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
  },
  statLabel: { fontSize: 11, fontWeight: "600", color: colors.textMuted, letterSpacing: 0.3, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  statChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statChipText: { fontSize: 11, fontWeight: "600" },

  // Cards
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.md },

  // Empty states
  emptyChart: { alignItems: "center", paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },

  // Lists in cards
  listItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  listTitle: { fontSize: 14, fontWeight: "500", color: colors.textPrimary },
  listValue: { fontSize: 14, fontWeight: "700", color: colors.primary },
  listCount: { fontSize: 12, color: colors.textMuted },

  // Activity
  activityItem: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, gap: 10 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  activityAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  activityAvatarText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  activityBody: { flex: 1 },
  activityText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  activityAction: { color: colors.textSecondary },
  activityTarget: { fontWeight: "600", color: colors.textPrimary },
  activityMeta: { color: colors.textSecondary },
  activityTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
