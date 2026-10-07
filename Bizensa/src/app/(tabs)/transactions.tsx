import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, StatusBar,} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, components } from "@/constants/theme";
import {
  Transaction,
  buildTransactions,
  dayKey,
  formatLongDate,
  formatMoney,
  iconForTransaction,
  tintForTransaction,
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
  green: T.success,
  red: T.danger,
};

type Filter = "all" | "income" | "expense";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
];

const Row = ({
               item,
               last,
               onPress,
             }: {
  item: Transaction;
  last: boolean;
  onPress: () => void;
}) => {
  const tint = tintForTransaction(item);
  const isIncome = item.type === "income";
  return (
      <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={[styles.row, !last && styles.rowDivider]}
      >
        <View style={[styles.rowIcon, { backgroundColor: tint.bg, borderColor: tint.border }]}>
          <Ionicons name={iconForTransaction(item)} size={20} color={tint.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowSub}>{item.subtitle}</Text>
        </View>
        <Text style={[styles.rowAmount, { color: isIncome ? C.green : C.red }]}>
          {isIncome ? "+" : "-"} {formatMoney(item.amount)}
        </Text>
      </TouchableOpacity>
  );
};

export default function Transactions() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, loading } = useAppData();
  const transactions = useMemo(() => buildTransactions(data), [data]);

  const [filter, setFilter] = useState<Filter>("all");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = transactions.filter(
        (t) =>
            (filter === "all" || t.type === filter) &&
            (!q || t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // group by local calendar day (dates from the API include a time)
    const map = new Map<string, Transaction[]>();
    list.forEach((t) => {
      const k = dayKey(t.date);
      map.set(k, [...(map.get(k) ?? []), t]);
    });
    return Array.from(map.entries());
  }, [transactions, filter, query]);

  const tabBar = components.tabBar;
  const tabBarSpace = tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset);

  const openDetails = (id: string) =>
      router.push({ pathname: "/transaction/[id]", params: { id } });

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.header}>
          <Text style={styles.title}>Transactions</Text>
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
                  placeholder="Search transactions"
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
          {groups.length === 0 && (
              <Text style={styles.empty}>
                {loading ? "Loading..." : "No transactions found."}
              </Text>
          )}
          {groups.map(([date, items]) => (
              <View key={date} style={{ marginBottom: 22 }}>
                <Text style={styles.dateHeading}>{formatLongDate(date)}</Text>
                <View style={styles.group}>
                  {items.map((t, i) => (
                      <Row
                          key={t.id}
                          item={t}
                          last={i === items.length - 1}
                          onPress={() => openDetails(t.id)}
                      />
                  ))}
                </View>
              </View>
          ))}
        </ScrollView>

        {/*<TouchableOpacity*/}
        {/*  style={[styles.fab, { bottom: tabBarSpace + 16 }]}*/}
        {/*  activeOpacity={0.85}*/}
        {/*  onPress={() => router.push("/add-expense")}*/}
        {/*>*/}
        {/*  <Ionicons name="add" size={30} color="#fff" />*/}
        {/*</TouchableOpacity>*/}
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
    paddingHorizontal: 22,
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

  dateHeading: { color: C.text, fontSize: 14, fontWeight: "600", marginBottom: 10 },
  group: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  rowSub: { color: C.muted, fontSize: 13, marginTop: 3 },
  rowAmount: { fontSize: 14, fontWeight: "700" },

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
