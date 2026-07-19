import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useState } from "react";
import { colors, spacing, radius } from "../../src/theme";

const MOCK_LEADS = [
  { id: "1", board: "Sales Pipeline", list: "Incoming", name: "Acme Corp Deal", client: "Acme Corp", priority: "High", source: "Website", value: "₹5,00,000" },
  { id: "2", board: "Sales Pipeline", list: "Contacted", name: "Site Visit Inquiry", client: "John Doe", priority: "Medium", source: "Referral", value: "₹2,50,000" },
  { id: "3", board: "Partnerships", list: "New Leads", name: "TechFlow Demo", client: "TechFlow Inc.", priority: "Low", source: "Cold Outreach", value: "₹1,20,000" },
];

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  High: { bg: "#FEE2E2", text: "#B91C1C" },
  Medium: { bg: "#FEF3C7", text: "#92400E" },
  Low: { bg: "#DBEAFE", text: "#1D4ED8" },
};

export default function Reports() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_LEADS.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📈  Reports</Text>
        <Text style={styles.pageSubtitle}>Track and analyze your pipeline data.</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
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

        {/* Results count */}
        <Text style={styles.resultsCount}>{filtered.length} leads found</Text>

        {/* Lead cards */}
        {filtered.map((lead) => {
          const p = PRIORITY_COLORS[lead.priority] ?? PRIORITY_COLORS.Low;
          return (
            <View key={lead.id} style={styles.leadCard}>
              <View style={styles.leadTop}>
                <Text style={styles.leadName}>{lead.name}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                  <Text style={[styles.priorityText, { color: p.text }]}>{lead.priority}</Text>
                </View>
              </View>
              <Text style={styles.leadClient}>{lead.client}</Text>
              <View style={styles.leadMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Board</Text>
                  <Text style={styles.metaValue}>{lead.board}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>List</Text>
                  <Text style={styles.metaValue}>{lead.list}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Source</Text>
                  <Text style={styles.metaValue}>{lead.source}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Value</Text>
                  <Text style={[styles.metaValue, styles.valueText]}>{lead.value}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No leads found</Text>
          </View>
        )}

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
  priorityText: { fontSize: 11, fontWeight: "700" },
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
