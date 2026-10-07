import React, { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    LayoutChangeEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
    Defs,
    LinearGradient,
    Stop,
    Path,
    Circle,
    Line,
    Text as SvgText,
} from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { Colors, components } from "@/constants/theme";
import {
    ApiUser,
    AppData,
    formatCompact,
    formatMoney,
    useAppData,
    useCurrentUser,
} from "@/constants/api";

/* ---------- Types ---------- */
type IconName = React.ComponentProps<typeof Ionicons>["name"];
type QuickActionKey = "expense" | "income" | "invoice" | "customer";

interface QuickAction {
    key: QuickActionKey;
    label: string;
    icon: IconName;
}

/* ---------- Theme ---------- */
const T = Colors.dark;

const C = {
    bg: T.background,
    card: T.surface,
    border: T.border,
    purple: T.primary,
    purpleSoft: T.primarySoft,
    purpleDark: T.primaryDark,
    text: T.text,
    muted: T.textSecondary,
    green: T.success,
    red: T.danger,
};

const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
};

const QUICK_ACTIONS: QuickAction[] = [
    { key: "expense", label: "Expense", icon: "add" },
    { key: "income", label: "Income", icon: "download-outline" },
    { key: "invoice", label: "Invoice", icon: "document-text-outline" },
    { key: "customer", label: "Customer", icon: "people-outline" },
];

/* ---------- Derived numbers from /api/data ---------- */

const CHART_DAYS = 12;

/**
 * Percentage change that never hides the arrow when last month is empty.
 *
 *  - previous = 0 and current = 0  -> 0   (shows "0%")
 *  - previous = 0 and current > 0  -> 100 (went from nothing to something)
 *  - previous = 0 and current < 0  -> -100
 *  - otherwise normal % change, rounded to 1 decimal
 */
const safePctChange = (current: number, previous: number): number => {
    if (previous === 0) {
        if (current === 0) return 0;
        return current > 0 ? 100 : -100;
    }
    const raw = ((current - previous) / Math.abs(previous)) * 100;
    return Math.round(raw * 10) / 10;
};

const sameMonth = (iso: string, ref: Date) => {
    const d = new Date(iso);
    return (
        d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear()
    );
};

const sumMonth = (rows: { amount: number; date: string }[], ref: Date) =>
    rows.filter((r) => sameMonth(r.date, ref)).reduce((s, r) => s + r.amount, 0);

function deriveDashboard(data: AppData) {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const incomeNow = sumMonth(data.income, now);
    const incomePrev = sumMonth(data.income, prev);

    const expNow = sumMonth(data.expenses, now);
    const expPrev = sumMonth(data.expenses, prev);

    // Net = income - expenses, for total balance change
    const netNow = incomeNow - expNow;
    const netPrev = incomePrev - expPrev;

    // Expenses per day for the last CHART_DAYS days (oldest -> today)
    const days: number[] = Array(CHART_DAYS).fill(0);

    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).getTime();

    data.expenses.forEach((e) => {
        const d = new Date(e.date);
        const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const diff = Math.round((startOfToday - day) / 86400000);

        if (diff >= 0 && diff < CHART_DAYS) {
            days[CHART_DAYS - 1 - diff] += e.amount;
        }
    });

    return {
        balance: data.summary.balance,
        revenue: data.summary.totalIncome,
        expenses: data.summary.totalExpenses,

        balanceChange: safePctChange(netNow, netPrev),
        revenueChange: safePctChange(incomeNow, incomePrev),
        expensesChange: safePctChange(expNow, expPrev),

        chart: days,
    };
}

/* ---------- Small pieces ---------- */

/** Caret up -> green, caret down -> red. */
const Change = ({
                    value,
                    suffix = "",
                }: {
    value: number;
    suffix?: string;
}) => {
    const up = value >= 0;
    const color = up ? C.green : C.red;

    return (
        <View style={styles.changeRow}>
            <Ionicons name={up ? "caret-up" : "caret-down"} size={12} color={color} />

            <Text style={[styles.changeText, { color }]}>{Math.abs(value)}%</Text>

            {suffix ? <Text style={styles.changeSuffix}>{suffix}</Text> : null}
        </View>
    );
};

const Header = ({
                    user,
                    loading,
                }: {
    user: ApiUser | null;
    loading: boolean;
}) => (
    <View style={styles.header}>
        <View>
            <Text style={styles.greeting}>{getGreeting()}, 👋</Text>

            <Text style={styles.name}>
                {loading ? "Loading..." : user?.name ?? "Guest"}
            </Text>
        </View>

        <TouchableOpacity style={styles.bell} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={26} color={C.text} />
            <View style={styles.bellDot} />
        </TouchableOpacity>
    </View>
);

/* ---------- Balance Card ---------- */

const BalanceCard = ({
                         balance,
                         change,
                     }: {
    balance: number;
    change: number;
}) => {
    const up = change >= 0;

    return (
        <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>

            <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>

            <View style={styles.balanceChangeRow}>
                <Ionicons
                    name={up ? "caret-up" : "caret-down"}
                    size={12}
                    color={up ? C.green : C.red}
                />

                <Text
                    style={[
                        styles.balanceChangeText,
                        { color: up ? C.green : C.red },
                    ]}
                >
                    {Math.abs(change)}%
                </Text>

                <Text style={styles.balanceChangeSuffix}>from last month</Text>
            </View>
        </View>
    );
};

/* ---------- Stat Card ---------- */

const StatCard = ({
                      label,
                      value,
                      change,
                  }: {
    label: string;
    value: string;
    change: number;
}) => (
    <View style={styles.statCard}>
        <Text style={styles.cardLabel}>{label}</Text>

        <Text style={styles.statValue}>{value}</Text>

        <Change value={change} suffix="vs last month" />
    </View>
);

/* ---------- Quick Actions ---------- */

const QuickActions = ({
                          onPress,
                      }: {
    onPress?: (key: QuickActionKey) => void;
}) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((a) => (
                <TouchableOpacity
                    key={a.key}
                    style={styles.action}
                    activeOpacity={0.7}
                    onPress={() => onPress?.(a.key)}
                >
                    <View style={styles.actionIcon}>
                        <Ionicons name={a.icon} size={22} color={C.purpleSoft} />
                    </View>

                    <Text style={styles.actionLabel}>{a.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

/* ---------- Expense Chart ---------- */

/**
 * Nice round axis max:
 * 1000 -> 1000
 * 1300 -> 2000
 * 8200 -> 10000
 */
const niceMax = (v: number) => {
    if (v <= 0) return 1000;

    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / pow;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;

    return step * pow;
};

const ExpenseChart = ({ values }: { values: number[] }) => {
    const [width, setWidth] = useState(0);

    const height = 130;
    const padL = 40;
    const padB = 4;

    const max = niceMax(Math.max(...values, 0));
    const plotW = Math.max(width - padL, 0);
    const plotH = height - padB;

    const pts: [number, number][] = values.map((v, i) => [
        padL + (i / (values.length - 1)) * plotW,
        plotH - (v / max) * plotH,
    ]);

    const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");

    const area = `${line} L${padL + plotW},${plotH} L${padL},${plotH} Z`;

    const ticks = [max, (max * 2) / 3, max / 3, 0];

    const onLayout = (e: LayoutChangeEvent) =>
        setWidth(e.nativeEvent.layout.width - 28);

    return (
        <View style={styles.section}>
            <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Expense Overview</Text>

                <View style={styles.dropdown}>
                    <Text style={styles.dropdownText}>Last {values.length} days</Text>
                </View>
            </View>

            <View style={styles.chartCard} onLayout={onLayout}>
                {width > 0 && (
                    <Svg width={width} height={height + 8}>
                        <Defs>
                            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={C.purple} stopOpacity="0.35" />
                                <Stop offset="1" stopColor={C.purple} stopOpacity="0" />
                            </LinearGradient>
                        </Defs>

                        {ticks.map((t) => {
                            const y = plotH - (t / max) * plotH;

                            return (
                                <React.Fragment key={t}>
                                    <Line
                                        x1={padL}
                                        x2={padL + plotW}
                                        y1={y}
                                        y2={y}
                                        stroke={C.border}
                                        strokeWidth="1"
                                        strokeDasharray="3,4"
                                    />

                                    <SvgText
                                        x={0}
                                        y={Math.max(y + 4, 10)}
                                        fill={C.muted}
                                        fontSize="10"
                                    >
                                        {formatCompact(t)}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}

                        <Path d={area} fill="url(#area)" />

                        <Path
                            d={line}
                            fill="none"
                            stroke={C.purple}
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {pts.map((p, i) => (
                            <Circle key={i} cx={p[0]} cy={p[1]} r="3" fill={C.purpleSoft} />
                        ))}
                    </Svg>
                )}
            </View>
        </View>
    );
};

/* ---------- Screen ---------- */

export default function Index() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const { user, loading: userLoading } = useCurrentUser();
    const { data } = useAppData();

    const d = useMemo(() => deriveDashboard(data), [data]);

    const tabBar = components.tabBar;

    const bottomSpace =
        tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset) + 24;

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <StatusBar barStyle="light-content" backgroundColor={C.bg} />

            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: bottomSpace }]}
                showsVerticalScrollIndicator={false}
            >
                <Header user={user} loading={userLoading} />

                <BalanceCard balance={d.balance} change={d.balanceChange} />

                <View style={styles.statsRow}>
                    <StatCard
                        label="Revenue"
                        value={formatMoney(d.revenue)}
                        change={d.revenueChange}
                    />

                    <StatCard
                        label="Expenses"
                        value={formatMoney(d.expenses)}
                        change={d.expensesChange}
                    />
                </View>

                <QuickActions
                    onPress={(key) => {
                        if (key === "expense") router.push("/add-expense");
                        else if (key === "income") router.push("/add-income");
                        else if (key === "invoice") router.push("/invoices");
                        else if (key === "customer") router.push("/add-customer");
                    }}
                />

                <ExpenseChart values={d.chart} />
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: C.bg,
    },

    scroll: {
        padding: 20,
    },

    /* Header */
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    greeting: {
        color: C.text,
        fontSize: 18,
        fontWeight: "600",
    },

    name: {
        color: C.text,
        fontSize: 18,
        fontWeight: "600",
        marginTop: 2,
    },

    bell: {
        padding: 4,
    },

    bellDot: {
        position: "absolute",
        top: 4,
        right: 5,
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: C.purple,
        borderWidth: 1.5,
        borderColor: C.bg,
    },

    /* Total Balance */
    balanceCard: {
        borderRadius: 18,
        padding: 20,
        overflow: "hidden",
        backgroundColor: C.purpleDark,
        borderWidth: 1,
        borderColor: C.purpleDark,
    },

    balanceLabel: {
        color: "#D9B8FF",
        fontSize: 13,
    },

    balanceValue: {
        color: C.text,
        fontSize: 32,
        fontWeight: "700",
        marginTop: 8,
    },

    balanceChangeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        gap: 4,
    },

    balanceChangeText: {
        fontSize: 13,
        fontWeight: "700",
    },

    balanceChangeSuffix: {
        color: "#D9B8FF",
        fontSize: 12,
        marginLeft: 2,
    },

    /* Stats */
    cardLabel: {
        color: C.muted,
        fontSize: 13,
    },

    statsRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 14,
    },

    statCard: {
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: C.border,
    },

    statValue: {
        color: C.text,
        fontSize: 19,
        fontWeight: "700",
        marginVertical: 8,
    },

    changeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    changeText: {
        fontSize: 13,
        fontWeight: "600",
    },

    changeSuffix: {
        color: C.muted,
        fontSize: 12,
        marginLeft: 4,
    },

    /* Sections */
    section: {
        marginTop: 24,
    },

    sectionHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    sectionTitle: {
        color: C.text,
        fontSize: 16,
        fontWeight: "700",
    },

    /* Quick Actions */
    actionsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },

    action: {
        alignItems: "center",
        flex: 1,
    },

    actionIcon: {
        width: 58,
        height: 58,
        borderRadius: 16,
        backgroundColor: "#1c1030",
        borderWidth: 1,
        borderColor: "#4a2390",
        alignItems: "center",
        justifyContent: "center",
    },

    actionLabel: {
        color: C.text,
        fontSize: 12,
        marginTop: 8,
    },

    /* Chart */
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    dropdownText: {
        color: C.muted,
        fontSize: 13,
    },

    chartCard: {
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        marginTop: 14,
    },
});
