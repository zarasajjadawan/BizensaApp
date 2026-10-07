import React, { useCallback, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useFocusEffect, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors, components } from "@/constants/theme";
import { API_URL } from "@/constants/api";

const T = Colors.dark;
const C = {
  bg: T.background,
  card: T.surface,
  border: T.border,
  purple: T.primary,
  purpleSoft: T.primarySoft,
  text: T.text,
  muted: T.textSecondary,
  red: T.danger,
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface ApiUser {
  id: string;
  name: string;
  businessName: string;
  email: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: IconName;
  route?: string;
}

const MENU: MenuItem[] = [
  { key: "personal", label: "Personal Information", icon: "person-outline", route: "/personal-information" },
  { key: "business", label: "Business Details", icon: "business-outline", route: "/business-details" },
  { key: "payment", label: "Payment Methods", icon: "card-outline", route: "/payment-methods" },
  { key: "notifications", label: "Notifications", icon: "notifications-outline", route: "/notifications" },
  { key: "security", label: "Security", icon: "shield-checkmark-outline", route: "/security" },
  { key: "appearance", label: "Appearance", icon: "contrast-outline", route: "/appearance" },
  { key: "currency", label: "Currency", icon: "globe-outline", route: "/currency" },
];

const initialsOf = (name?: string) =>
    (name ?? "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "?";

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (res.status === 401) {
        await SecureStore.deleteItemAsync("token");
        router.replace("/(auth)/sign-in");
        return;
      }

      const json = await res.json();
      if (res.ok && json.success) setUser(json.data.user);
    } catch (err) {
      console.log("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Reload every time this tab is focused, so edits (name, business name...)
  // show up right away after saving on another screen.
  useFocusEffect(
      useCallback(() => {
        fetchUser();
      }, [fetchUser])
  );

  const logout = () => {
    Alert.alert("Log out?", "You will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("token");
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const tabBar = components.tabBar;
  const bottomSpace = tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset) + 24;

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.topBar}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.gear} hitSlop={12} activeOpacity={0.7}>
            <Ionicons name="settings-sharp" size={24} color={C.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomSpace }}
            showsVerticalScrollIndicator={false}
        >
          {/* User */}
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsOf(user?.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{loading ? "Loading..." : user?.name ?? "Guest"}</Text>
              <Text style={styles.userRole}>Business Owner</Text>
            </View>
          </View>

          <View style={styles.businessCard}>
            <View>
              <Text style={styles.businessLabel}>Business</Text>
              <Text style={styles.businessName}>
                {loading ? "Loading..." : user?.businessName ?? "-"}
              </Text>
            </View>
          </View>

          {/* Menu */}
          <View style={styles.menu}>
            {MENU.map((m, i) => (
                <TouchableOpacity
                    key={m.key}
                    style={[styles.menuRow, i < MENU.length - 1 && styles.menuDivider]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (m.route) router.push(m.route as any);
                    }}
                >
                  <Ionicons name={m.icon} size={22} color={C.text} />
                  <Text style={styles.menuLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={C.text} />
                </TouchableOpacity>
            ))}
          </View>

          {/* Log out */}
          <TouchableOpacity style={styles.logout} activeOpacity={0.7} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={C.red} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: { height: 52, alignItems: "center", justifyContent: "center" },
  title: { color: C.text, fontSize: 20, fontWeight: "600" },
  gear: { position: "absolute", right: 20 },

  userRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 20, marginBottom: 24 },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#1c1030",
    borderWidth: 2,
    borderColor: "#4a2390",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.purpleSoft, fontSize: 26, fontWeight: "700" },
  userName: { color: C.text, fontSize: 22, fontWeight: "700" },
  userRole: { color: C.muted, fontSize: 15, marginTop: 4 },

  businessCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  businessLabel: { color: C.text, fontSize: 13, fontWeight: "600" },
  businessName: { color: C.text, fontSize: 16, marginTop: 6 },

  menu: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 18,
    height: 56,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  menuLabel: { flex: 1, color: C.text, fontSize: 15 },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.red,
    backgroundColor: "#1c0a0c",
  },
  logoutText: { color: C.red, fontSize: 16, fontWeight: "600" },
});
