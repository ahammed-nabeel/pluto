import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { colors, spacing, radius, typography } from "../../src/theme";
import { fetchWithAuth } from "../../src/api";
import PlutoLogo from "../../components/Logo";

export default function Boards() {
  const [boards, setBoards] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    myTasks: 0,
    dueToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      // Fetch boards
      const boardsRes = await fetchWithAuth("/boards");
      if (boardsRes.ok) {
        const json = await boardsRes.json();
        setBoards(json.data || []);
      }

      // Fetch dashboard stats for high-level metrics
      const dashRes = await fetchWithAuth("/dashboard");
      if (dashRes.ok) {
        const json = await dashRes.json();
        const data = json.data;
        
        // Sum total open tasks across all statuses except completed
        const openTasks = data.tasksByStatus
          ?.filter((s: any) => s.status !== "completed")
          .reduce((sum: number, s: any) => sum + s.count, 0) || 0;

        setStats({
          totalTasks: openTasks,
          myTasks: data.tasksByUser?.[0]?.count || 0, // Simplified for now
          dueToday: data.overdueTasksCount || 0,
        });
      }
    } catch (error) {
      console.error("Error loading boards:", error);
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

  // Use a consistent array for stats rendering
  const statItems = [
    { label: "TOTAL OPEN TASKS", value: stats.totalTasks.toString(), icon: "📋" },
    { label: "MY OPEN TASKS", value: stats.myTasks.toString(), icon: "✅" },
    { label: "DUE TODAY", value: stats.dueToday.toString(), icon: "⏰" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logo}>
            <View style={styles.logoIcon}>
              <PlutoLogo size={18} />
            </View>
            <Text style={styles.logoText}>pluto.</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.notifBtn}>
              <Text style={styles.notifIcon}>🔔</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>TU</Text>
            </View>
          </View>
        </View>

        {/* Page title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.pageTitle}>📋  Boards</Text>
            <Text style={styles.pageSubtitle}>Manage your workspace projects, lists, and leads.</Text>
          </View>
          <Pressable style={styles.newBoardBtn} onPress={() => {}}>
            <Text style={styles.newBoardBtnText}>+ New Board</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={styles.body} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Stats row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={styles.statsContent}>
            {statItems.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* My Boards */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Boards</Text>
            {boards.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>No boards found.</Text>
            ) : (
              boards.map((board) => (
                <Pressable
                  key={board.id}
                  style={styles.boardCard}
                  onPress={() => router.push(`/(tabs)/board/${board.id}`)}
                >
                  <View style={[styles.boardColorBar, { backgroundColor: board.settings?.color || "#2563EB" }]} />
                  <View style={styles.boardCardBody}>
                    <View style={styles.boardCardTop}>
                      <Text style={styles.boardName}>{board.name}</Text>
                      <Text style={styles.boardUpdated}>
                        {new Date(board.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.boardDesc}>{board.description || "No description"}</Text>
                    <View style={styles.boardMeta}>
                      <Text style={styles.boardMetaText}>📄 {board._count?.lists || 0} lists</Text>
                      <Text style={styles.boardMetaDot}>·</Text>
                      <Text style={styles.boardMetaText}>🃏 {board._count?.cards || 0} cards</Text>
                    </View>
                  </View>
                  <Text style={styles.boardArrow}>›</Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },

  // Header
  header: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  logo: { flexDirection: "row", alignItems: "center", gap: 6 },
  logoIcon: {
    width: 28,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { fontSize: 18, fontWeight: "700", color: colors.textPrimary },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.bgPage,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIcon: { fontSize: 16 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: { fontSize: 20, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: colors.textSecondary },
  newBoardBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 2,
  },
  newBoardBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Body
  body: { flex: 1 },

  // Stats
  statsRow: { marginTop: spacing.md },
  statsContent: { paddingHorizontal: spacing.md, gap: 10, paddingRight: spacing.md },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 170,
  },
  statIcon: { fontSize: 22 },
  statLabel: { fontSize: 10, fontWeight: "600", color: colors.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: "700", color: colors.textPrimary, marginTop: 1 },

  // Boards
  section: { paddingHorizontal: spacing.md, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.textSecondary, marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: "uppercase" },
  boardCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  boardColorBar: { width: 4, alignSelf: "stretch" },
  boardCardBody: { flex: 1, padding: 14 },
  boardCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  boardName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  boardUpdated: { fontSize: 11, color: colors.textMuted },
  boardDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  boardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  boardMetaText: { fontSize: 12, color: colors.textMuted },
  boardMetaDot: { color: colors.textMuted, fontSize: 12 },
  boardArrow: { fontSize: 22, color: colors.textMuted, paddingRight: 14 },
});
