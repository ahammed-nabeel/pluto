import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { colors, spacing, radius } from "../../src/theme";
import { fetchWithAuth } from "../../src/api";

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: "#FEE2E2", text: "#B91C1C" },
  medium: { bg: "#FEF3C7", text: "#92400E" },
  low: { bg: "#DBEAFE", text: "#1D4ED8" },
  High: { bg: "#FEE2E2", text: "#B91C1C" },
  Medium: { bg: "#FEF3C7", text: "#92400E" },
  Low: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export default function Reports() {
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (query = "") => {
    try {
      const url = query ? `/reports?search=${encodeURIComponent(query)}` : `/reports`;
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const json = await res.json();
        setLeads(json.data || []);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Debounce search slightly
    setLoading(true);
    const delay = setTimeout(() => {
      loadData(search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(search);
  }, [search]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📈  Reports</Text>
        <Text style={styles.pageSubtitle}>Track and analyze your pipeline data.</Text>
      </View>

      <View style={styles.body}>
        {/* Filter bar */}
        <View style={styles.filterRow}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable style={styles.exportBtn}>
            <Text style={styles.exportBtnText}>⬇ Export</Text>
          </Pressable>
        </View>

        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Results count */}
            <Text style={styles.resultsCount}>{leads.length} leads found</Text>

            {/* Lead cards */}
            {leads.map((lead) => {
              const p = PRIORITY_COLORS[lead.priority || "low"] ?? PRIORITY_COLORS.low;
              return (
                <View key={lead.id} style={styles.leadCard}>
                  <View style={styles.leadTop}>
                    <Text style={styles.leadName}>{lead.project_name || "Untitled Lead"}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                      <Text style={[styles.priorityText, { color: p.text }]}>{lead.priority || "low"}</Text>
                    </View>
                  </View>
                  <Text style={styles.leadClient}>{lead.client_name || "Unknown Client"}</Text>
                  <View style={styles.leadMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Board</Text>
                      <Text style={styles.metaValue}>{lead.board?.name || "N/A"}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>List</Text>
                      <Text style={styles.metaValue}>{lead.list?.title || "N/A"}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Source</Text>
                      <Text style={styles.metaValue}>{lead.source || "None"}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaLabel}>Value</Text>
                      <Text style={[styles.metaValue, styles.valueText]}>
                        {lead.card_value 
                          ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lead.card_value)
                          : "₹0"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {leads.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No leads found</Text>
              </View>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </View>
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

  // Filters
  filterRow: { flexDirection: "row", gap: 10, marginBottom: spacing.sm },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, height: 40, fontSize: 14, color: colors.textPrimary },
  exportBtn: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  exportBtnText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },

  resultsCount: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },

  // Lead cards
  leadCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  leadName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, flex: 1, marginRight: 8 },
  leadClient: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  priorityText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  leadMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: {},
  metaLabel: { fontSize: 10, fontWeight: "600", color: colors.textMuted, letterSpacing: 0.3, marginBottom: 2 },
  metaValue: { fontSize: 13, color: colors.textPrimary, fontWeight: "500" },
  valueText: { color: colors.primary, fontWeight: "700" },

  // Empty
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
