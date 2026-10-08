import React, { useMemo, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { C, themedStyles } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import { ApiCustomer, useCustomers } from "@/constants/api";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const CustomerRow = ({
  item,
  last,
  onPress,
}: {
  item: ApiCustomer;
  last: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={[styles.row, !last && styles.rowDivider]}
  >
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initialsOf(item.name)}</Text>
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{item.name}</Text>
      <Text style={styles.rowSub} numberOfLines={1}>
        {item.businessName || item.phone || item.email || "No details"}
      </Text>
    </View>

    <Ionicons name="chevron-forward" size={18} color={C.muted} />
  </TouchableOpacity>
);

export default function Customers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Reloads every time this screen is focused (after add / edit / delete)
  const { customers, loading } = useCustomers();

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.businessName ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedStatusBar />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Customers</Text>

        <TouchableOpacity
          hitSlop={10}
          onPress={() => {
            setSearching((s) => !s);
            setQuery("");
          }}
        >
          <Ionicons name={searching ? "close" : "search"} size={24} color={C.text} />
        </TouchableOpacity>
      </View>

      {searching && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={C.muted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers"
            placeholderTextColor={C.muted}
            autoFocus
          />
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {list.length === 0 ? (
          <Text style={styles.empty}>
            {loading
              ? "Loading..."
              : customers.length === 0
              ? "No customers yet. Tap + to add one."
              : "No customers found."}
          </Text>
        ) : (
          <View style={styles.group}>
            {list.map((c, i) => (
              <CustomerRow
                key={c._id}
                item={c}
                last={i === list.length - 1}
                onPress={() =>
                  router.push({ pathname: "/customer/[id]", params: { id: c._id } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.85}
        onPress={() => router.push("/add-customer")}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  back: { width: 32 },
  title: { color: C.text, fontSize: 20, fontWeight: "700" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 15 },

  group: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.chipBg,
    borderWidth: 1,
    borderColor: C.chipBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.purpleSoft, fontSize: 16, fontWeight: "700" },
  rowTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  rowSub: { color: C.muted, fontSize: 13, marginTop: 3 },

  empty: { color: C.muted, textAlign: "center", marginTop: 60, paddingHorizontal: 20 },

  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: C.purple,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
}));
