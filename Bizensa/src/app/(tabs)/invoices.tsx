import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors, components } from "@/constants/theme";
import {
  ApiInvoice,
  InvoiceStatus,
  STATUS_COLOR,
  STATUS_LABEL,
  formatMoney,
  formatShortDate,
  invoiceStatus,
  useAppData,
} from "@/constants/api";

const T = Colors.dark;
const C = {
  bg: T.background,
  card: T.surface,
  border: T.border,
  purple: T.primary,
  text: T.text,
  muted: T.textSecondary,
};

type Filter = "all" | InvoiceStatus;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
];

const InvoiceCard = ({ item, onPress }: { item: ApiInvoice; onPress: () => void }) => {
  const status = invoiceStatus(item);
  return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
        <View style={styles.cardRow}>
          <Text style={styles.number}>{item.invoiceNumber}</Text>
          <Text style={styles.amount}>{formatMoney(item.total)}</Text>
        </View>
        <Text style={styles.customer}>{item.customer}</Text>
        <View style={styles.cardRow}>
          <Text style={styles.date}>Due {formatShortDate(item.dueDate)}</Text>
          <Text style={[styles.status, { color: STATUS_COLOR[status] }]}>
            {STATUS_LABEL[status]}
          </Text>
        </View>
      </TouchableOpacity>
  );
};

export default function Invoices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, loading } = useAppData();

  const [filter, setFilter] = useState<Filter>("all");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...data.invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .filter(
            (i) =>
                (filter === "all" || invoiceStatus(i) === filter) &&
                (!q ||
                    i.invoiceNumber.toLowerCase().includes(q) ||
                    i.customer.toLowerCase().includes(q))
        );
  }, [data.invoices, filter, query]);

  const tabBar = components.tabBar;
  const tabBarSpace = tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset);

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
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
                  placeholder="Search invoices"
                  placeholderTextColor={C.muted}
                  autoFocus
              />
            </View>
        )}

        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
                <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.8}
                    onPress={() => setFilter(f.key)}
                    style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && { color: "#fff", fontWeight: "700" }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: tabBarSpace + 90 }}
            showsVerticalScrollIndicator={false}
        >
          {list.length === 0 && (
              <Text style={styles.empty}>{loading ? "Loading..." : "No invoices found."}</Text>
          )}
          {list.map((inv) => (
              <InvoiceCard
                  key={inv._id}
                  item={inv}
                  onPress={() => {
                    // TODO: open an invoice details screen (e.g. /invoice/[id])
                  }}
              />
          ))}
        </ScrollView>

        <TouchableOpacity
            style={[styles.fab, { bottom: tabBarSpace + 16 }]}
            activeOpacity={0.85}
            onPress={() => router.push("/create-invoice")}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: { color: C.text, fontSize: 22, fontWeight: "700" },

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

  chips: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  chip: {
    paddingHorizontal: 20,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: C.purple, borderColor: C.purple },
  chipText: { color: C.text, fontSize: 14 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 14,
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { color: C.text, fontSize: 16, fontWeight: "700" },
  amount: { color: C.text, fontSize: 16, fontWeight: "700" },
  customer: { color: C.muted, fontSize: 14, marginTop: 8, marginBottom: 10 },
  date: { color: C.muted, fontSize: 14 },
  status: { fontSize: 14, fontWeight: "600" },

  empty: { color: C.muted, textAlign: "center", marginTop: 40 },

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
});
