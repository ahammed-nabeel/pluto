import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import { colors } from "../../src/theme";

// Simple SVG-free icons using text/unicode
function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <View style={[styles.iconDot]}>
        {/* Icon character rendered as Text inside pressable */}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.navInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="boards"
        options={{
          title: "Boards",
          tabBarIcon: ({ color }) => (
            <View style={[styles.tabIcon, { borderColor: color }]}>
              <View style={[styles.tabIconInner, { backgroundColor: color }]} />
              <View style={[styles.tabIconInner, { backgroundColor: color }]} />
              <View style={[styles.tabIconInner, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <View style={styles.dashIcon}>
              <View style={[styles.dashBar, styles.dashBar1, { backgroundColor: color }]} />
              <View style={[styles.dashBar, styles.dashBar2, { backgroundColor: color }]} />
              <View style={[styles.dashBar, styles.dashBar3, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <View style={styles.reportIcon}>
              <View style={[styles.reportLine, { backgroundColor: color }]} />
              <View style={[styles.reportLine, styles.reportLineShort, { backgroundColor: color }]} />
              <View style={[styles.reportLine, { backgroundColor: color }]} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tabItem: {
    paddingTop: 2,
  },
  iconWrap: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  iconWrapActive: {},
  iconDot: {},
  // Board icon (3 columns)
  tabIcon: {
    width: 22,
    height: 18,
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
    borderWidth: 0,
  },
  tabIconInner: {
    width: 5,
    height: 18,
    borderRadius: 2,
  },
  // Dashboard bar chart icon
  dashIcon: {
    width: 22,
    height: 18,
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
  },
  dashBar: { width: 5, borderRadius: 2 },
  dashBar1: { height: 12 },
  dashBar2: { height: 18 },
  dashBar3: { height: 8 },
  // Reports lines icon
  reportIcon: {
    width: 22,
    height: 18,
    justifyContent: "center",
    gap: 4,
  },
  reportLine: { height: 2, borderRadius: 1, width: "100%" },
  reportLineShort: { width: "70%" },
});
