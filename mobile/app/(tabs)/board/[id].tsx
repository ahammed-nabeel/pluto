import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { colors, spacing, radius } from "../../../src/theme";
import { fetchWithAuth } from "../../../src/api";

const PRIORITY: Record<string, { bg: string; text: string }> = {
  high: { bg: "#FEE2E2", text: "#B91C1C" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#DBEAFE", text: "#1D4ED8" },
  High: { bg: "#FEE2E2", text: "#B91C1C" },
  Medium: { bg: "#FEF3C7", text: "#92400E" },
  Low: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export default function BoardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetchWithAuth(`/boards/${id}`);
      if (res.ok) {
        const json = await res.json();
        setBoard(json.data);
      }
    } catch (error) {
      console.error("Error loading board details:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [id]);

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!board) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text>Board not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹ Back</Text>
        </Pressable>
        <Text style={styles.boardTitle} numberOfLines={1}>{board.name}</Text>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconBtn}><Text>⚙️</Text></Pressable>
        </View>
      </View>

      {/* Tab bar (Board View active) */}
      <View style={styles.subNav}>
        <Pressable style={[styles.subNavTab, styles.subNavTabActive]}>
          <Text style={styles.subNavTextActive}>Board View</Text>
        </Pressable>
        <Pressable style={styles.subNavTab}>
          <Text style={styles.subNavText}>Dashboard</Text>
        </Pressable>
        <Pressable style={styles.subNavTab}>
          <Text style={styles.subNavText}>Reports</Text>
        </Pressable>
      </View>

      {/* Kanban Board - horizontal scroll */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.board}
      >
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ flexDirection: "row" }}
        >
          {board.lists?.map((list: any) => (
            <View key={list.id} style={styles.column}>
              {/* Column header */}
              <View style={styles.columnHeader}>
                <Text style={styles.columnTitle}>{list.title}</Text>
                <View style={styles.countBubble}>
                  <Text style={styles.countText}>{list.cards?.length || 0}</Text>
                </View>
                <Pressable style={styles.colMenu}><Text style={styles.colMenuDots}>⋯</Text></Pressable>
              </View>

              {/* Cards */}
              <ScrollView showsVerticalScrollIndicator={false} style={styles.cardScroll}>
                {list.cards?.map((card: any) => {
                  const p = PRIORITY[card.priority || "low"] ?? PRIORITY.low;
                  return (
                    <Pressable key={card.id} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={2}>{card.title}</Text>
                      </View>
                      <View style={styles.cardFooter}>
                        <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                          <Text style={[styles.priorityText, { color: p.text }]}>
                            {card.priority || "low"}
                          </Text>
                        </View>
                        {card.card_value != null && (
                          <Text style={styles.cardValue}>
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.card_value)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.cardAssignee}>
                        <View style={styles.assigneeAvatar}>
                          <Text style={styles.assigneeText}>
                            {getInitials(card.cardOwner?.name)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {/* Add card button */}
                <Pressable style={styles.addCardBtn}>
                  <Text style={styles.addCardText}>+ Add card</Text>
                </Pressable>
              </ScrollView>
            </View>
          ))}

          {/* Add list button */}
          <Pressable style={styles.addListBtn}>
            <Text style={styles.addListText}>+ Add list</Text>
          </Pressable>
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EFF6FF" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.md,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { marginRight: 12 },
  backIcon: { fontSize: 15, color: colors.primary, fontWeight: "600" },
  boardTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  headerRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Sub nav
  subNav: {
    flexDirection: "row",
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  subNavTab: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 4 },
  subNavTabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  subNavText: { fontSize: 13, fontWeight: "500", color: colors.textSecondary },
  subNavTextActive: { fontSize: 13, fontWeight: "600", color: colors.primary },

  // Board
  board: { flex: 1, padding: 12 },

  // Column
  column: {
    width: 250,
    backgroundColor: "#F1F5F9",
    borderRadius: radius.lg,
    marginRight: 10,
    maxHeight: "100%",
    padding: 10,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  columnTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  countBubble: {
    backgroundColor: "#E2E8F0",
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 6,
  },
  countText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  colMenu: { padding: 4 },
  colMenuDots: { fontSize: 16, color: colors.textMuted },
  cardScroll: { flexGrow: 0 },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 13, fontWeight: "600", color: colors.textPrimary, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  priorityText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  cardValue: { fontSize: 12, fontWeight: "700", color: colors.primary },
  cardAssignee: { flexDirection: "row", justifyContent: "flex-end" },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  assigneeText: { color: "#fff", fontSize: 9, fontWeight: "700" },

  // Add card
  addCardBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radius.md,
    marginTop: 4,
  },
  addCardText: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },

  // Add list
  addListBtn: {
    width: 200,
    height: 44,
    backgroundColor: "#E2E8F0",
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 2,
  },
  addListText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
});
