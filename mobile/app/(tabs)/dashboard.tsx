import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../../src/theme";

const STATS = [
  { label: "Total Leads/Projects", value: "1", delta: "+1 this week", color: colors.primary, bg: colors.primaryLight },
  { label: "Pipeline Value", value: "₹0", delta: "No value set", color: "#7C3AED", bg: "#F5F3FF" },
  { label: "Open Tasks", value: "0", delta: "All clear", color: "#059669", bg: "#ECFDF5" },
  { label: "Overdue Tasks", value: "0", delta: "No overdue", color: "#EF4444", bg: "#FEF2F2" },
];

const ACTIVITY = [
  { action: "Created card", target: "Acme Corp Deal", board: "Sales Pipeline", time: "2m ago", user: "TU" },
  { action: "Created list", target: "Incoming", board: "Sales Pipeline", time: "5m ago", user: "TU" },
  { action: "Created board", target: "Sales Pipeline", board: "", time: "10m ago", user: "TU" },
];

export default function Dashboard() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📊  Dashboard</Text>
        <Text style={styles.pageSubtitle}>Overview of your workspace activity.</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { borderLeftColor: stat.color }]}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <View style={[styles.statChip, { backgroundColor: stat.bg }]}>
                <Text style={[styles.statChipText, { color: stat.color }]}>{stat.delta}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pipeline placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pipeline by List</Text>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyText}>Create lists in a board to see pipeline data</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {ACTIVITY.map((item, i) => (
            <View key={i} style={[styles.activityItem, i < ACTIVITY.length - 1 && styles.activityBorder]}>
              <View style={styles.activityAvatar}>
                <Text style={styles.activityAvatarText}>{item.user}</Text>
              </View>
              <View style={styles.activityBody}>
                <Text style={styles.activityText}>
                  <Text style={styles.activityAction}>{item.action} </Text>
                  <Text style={styles.activityTarget}>"{item.target}"</Text>
                  {item.board ? <Text style={styles.activityMeta}> in {item.board}</Text> : null}
                </Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Lead Metrics placeholder */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lead Status Priority</Text>
          <View style={styles.emptyChart}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyText}>Add priority labels to cards to see metrics</Text>
          </View>
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
  statValue: { fontSize: 28, fontWeight: "700", marginBottom: 6 },
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
