import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { C, components, themedStyles, useAppTheme } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import { formatShortDateObj } from "@/constants/invoices";
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

type Filter = "all" | "income" | "expense";
const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "income", label: "Income" },
    { key: "expense", label: "Expense" },
];

type PickerTarget = "from" | "to" | null;
type Range = { from: Date | null; to: Date | null };

const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
};
const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x.getTime();
};

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
    const { isDark } = useAppTheme();

    const { data, loading } = useAppData();
    const transactions = useMemo(() => buildTransactions(data), [data]);

    const [filter, setFilter] = useState<Filter>("all");
    const [searching, setSearching] = useState(false);
    const [query, setQuery] = useState("");

    // Date range: what the user picked (draft) vs what is actually applied
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [applied, setApplied] = useState<Range>({ from: null, to: null });
    const [picker, setPicker] = useState<PickerTarget>(null);

    const onSearchDates = () => {
        if (fromDate && toDate && startOfDay(fromDate) > endOfDay(toDate)) {
            Alert.alert("Invalid range", "'From' date must be before 'To' date.");
            return;
        }
        setPicker(null);
        setApplied({ from: fromDate, to: toDate });
    };

    const clearFrom = () => {
        setFromDate(null);
        setApplied((a) => ({ ...a, from: null }));
    };
    const clearTo = () => {
        setToDate(null);
        setApplied((a) => ({ ...a, to: null }));
    };

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const fromTs = applied.from ? startOfDay(applied.from) : null;
        const toTs = applied.to ? endOfDay(applied.to) : null;

        const list = transactions
            .filter((t) => {
                const ts = new Date(t.date).getTime();
                return (
                    (filter === "all" || t.type === filter) &&
                    (fromTs === null || ts >= fromTs) &&
                    (toTs === null || ts <= toTs) &&
                    (!q || t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q))
                );
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // group by local calendar day (dates from the API include a time)
        const map = new Map<string, Transaction[]>();
        list.forEach((t) => {
            const k = dayKey(t.date);
            map.set(k, [...(map.get(k) ?? []), t]);
        });
        return Array.from(map.entries());
    }, [transactions, filter, query, applied]);

    const tabBar = components.tabBar;
    const tabBarSpace = tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset);

    const openDetails = (id: string) =>
        router.push({ pathname: "/transaction/[id]", params: { id } });

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <ThemedStatusBar />

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
            {/* Date range filter: From | To | Search (single row) */}
            <View style={styles.dateRow}>
                <TouchableOpacity
                    style={styles.dateBtn}
                    activeOpacity={0.7}
                    onPress={() => setPicker(picker === "from" ? null : "from")}
                >
                    <Ionicons name="calendar-outline" size={18} color={C.muted} />
                    <Text
                        style={[styles.dateText, !fromDate && { color: C.muted }]}
                        numberOfLines={1}
                    >
                        {fromDate ? formatShortDateObj(fromDate) : "From"}
                    </Text>
                    {fromDate && (
                        <TouchableOpacity hitSlop={10} onPress={clearFrom}>
                            <Ionicons name="close-circle" size={16} color={C.muted} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.dateBtn}
                    activeOpacity={0.7}
                    onPress={() => setPicker(picker === "to" ? null : "to")}
                >
                    <Ionicons name="calendar-outline" size={18} color={C.muted} />
                    <Text style={[styles.dateText, !toDate && { color: C.muted }]} numberOfLines={1}>
                        {toDate ? formatShortDateObj(toDate) : "To"}
                    </Text>
                    {toDate && (
                        <TouchableOpacity hitSlop={10} onPress={clearTo}>
                            <Ionicons name="close-circle" size={16} color={C.muted} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.dateSearchBtn} activeOpacity={0.85} onPress={onSearchDates}>
                    <Ionicons name="search" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {picker && (
                <View style={styles.pickerWrap}>
                    <DateTimePicker
                        value={(picker === "from" ? fromDate : toDate) ?? new Date()}
                        mode="date"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        themeVariant={isDark ? "dark" : "light"}
                        minimumDate={picker === "to" && fromDate ? fromDate : undefined}
                        maximumDate={picker === "from" && toDate ? toDate : undefined}
                        onChange={(event, d) => {
                            if (Platform.OS !== "ios") setPicker(null);
                            if (event.type === "dismissed" || !d) return;
                            if (picker === "from") setFromDate(d);
                            else setToDate(d);
                        }}
                    />
                    {Platform.OS === "ios" && (
                        <TouchableOpacity style={styles.doneBtn} onPress={() => setPicker(null)}>
                            <Text style={styles.doneText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

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

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: tabBarSpace + 90 }}
                showsVerticalScrollIndicator={false}
            >
                {groups.length === 0 && (
                    <Text style={styles.empty}>{loading ? "Loading..." : "No transactions found."}</Text>
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
        </SafeAreaView>
    );
}

const styles = themedStyles((C) => StyleSheet.create({
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

    // Date range row
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 14,
    },
    dateBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 44,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: C.card,
        borderWidth: 1,
        borderColor: C.border,
    },
    dateText: { flex: 1, color: C.text, fontSize: 14 },
    dateSearchBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: C.purple,
        alignItems: "center",
        justifyContent: "center",
    },
    pickerWrap: { paddingHorizontal: 20, marginBottom: 10 },
    doneBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
    doneText: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

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
}));