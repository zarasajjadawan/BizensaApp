import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Stop, Rect, Line, Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

import { C, components, themedStyles } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import {
  AppData,
  formatCompact,
  formatMoney,
  monthLabel,
  useAppData,
} from "@/constants/api";
import { SelectModal } from "@/components/form-parts";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/* ---------- Data from /api/data, grouped by month ---------- */
const BARS = 10; // each month is split into 10 equal day-ranges

interface MonthReport {
  revenue: number;
  expenses: number;
  income: number[]; // one total per bar
  expense: number[];
  labels: Record<number, string>; // bar index -> x-axis label
}

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

function buildReport(data: AppData, ref: Date): MonthReport {
  const key = monthKey(ref);
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const perBar = daysInMonth / BARS;
  const mon = ref.toLocaleDateString("en-US", { month: "short" });

  const income = Array(BARS).fill(0);
  const expense = Array(BARS).fill(0);
  let revenue = 0;
  let expenses = 0;

  const bucket = (iso: string) =>
      Math.min(BARS - 1, Math.floor((new Date(iso).getDate() - 1) / perBar));

  data.income.forEach((r) => {
    if (monthKey(new Date(r.date)) !== key) return;
    revenue += r.amount;
    income[bucket(r.date)] += r.amount;
  });
  data.expenses.forEach((r) => {
    if (monthKey(new Date(r.date)) !== key) return;
    expenses += r.amount;
    expense[bucket(r.date)] += r.amount;
  });

  const labelFor = (i: number) => `${Math.floor(i * perBar) + 1} ${mon}`;
  return {
    revenue,
    expenses,
    income,
    expense,
    labels: { 0: labelFor(0), 3: labelFor(3), 6: labelFor(6), 9: labelFor(9) },
  };
}

/** Months that have data (newest first). Always includes the current month. */
function monthOptions(data: AppData): Date[] {
  const map = new Map<number, Date>();
  const add = (d: Date) => map.set(monthKey(d), new Date(d.getFullYear(), d.getMonth(), 1));
  add(new Date());
  data.income.forEach((r) => add(new Date(r.date)));
  data.expenses.forEach((r) => add(new Date(r.date)));
  return Array.from(map.values()).sort((a, b) => b.getTime() - a.getTime());
}

/** Round axis max so the tallest bar always fits */
const niceMax = (v: number) => {
  if (v <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
};

/* ---------- Pieces ---------- */
const OverviewRow = ({
                       icon,
                       tint,
                       label,
                       value,
                     }: {
  icon: IconName;
  tint: { bg: string; border: string; fg: string };
  label: string;
  value: string;
}) => (
    <View style={styles.ovRow}>
      <View style={[styles.ovIcon, { backgroundColor: tint.bg, borderColor: tint.border }]}>
        <Ionicons name={icon} size={22} color={tint.fg} />
      </View>
      <View>
        <Text style={styles.ovLabel}>{label}</Text>
        <Text style={styles.ovValue}>{value}</Text>
      </View>
    </View>
);

const IncomeExpenseChart = ({ data }: { data: MonthReport }) => {
  const [width, setWidth] = useState(0);
  const plotH = 150;
  const labelH = 24;
  const padL = 40;
  const max = niceMax(Math.max(...data.income, ...data.expense, 0));
  const ticks = [max, (max * 2) / 3, max / 3, 0];

  const plotW = Math.max(width - padL, 0);
  const n = data.income.length;
  const slot = plotW / n;
  const barW = Math.min(slot * 0.55, 18);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 32);

  return (
      <View style={styles.card} onLayout={onLayout}>
        <Text style={styles.cardTitle}>Income vs Expense</Text>

        {width > 0 && (
            <Svg width={width} height={plotH + labelH} style={{ marginTop: 18 }}>
              <Defs>
                <LinearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#9333ea" />
                  <Stop offset="1" stopColor="#6b21a8" />
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
                      <SvgText x={0} y={Math.max(y + 4, 10)} fill={C.muted} fontSize="10">
                        {formatCompact(t)}
                      </SvgText>
                    </React.Fragment>
                );
              })}

              {data.income.map((inc, i) => {
                const cx = padL + slot * i + slot / 2;
                const incH = (inc / max) * plotH;
                const expH = (data.expense[i] / max) * plotH;
                return (
                    <React.Fragment key={i}>
                      <Rect
                          x={cx - barW / 2}
                          y={plotH - incH}
                          width={barW}
                          height={incH}
                          rx={4}
                          fill="url(#inc)"
                      />
                      <Rect
                          x={cx - barW / 2}
                          y={plotH - expH}
                          width={barW}
                          height={expH}
                          rx={4}
                          fill="#ef4444"
                          opacity={0.9}
                      />
                      {data.labels[i] && (
                          <SvgText
                              x={cx}
                              y={plotH + 17}
                              fill={C.muted}
                              fontSize="11"
                              textAnchor="middle"
                          >
                            {data.labels[i]}
                          </SvgText>
                      )}
                    </React.Fragment>
                );
              })}
            </Svg>
        )}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#9333ea" }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
      </View>
  );
};

/* ---------- Screen ---------- */
export default function Reports() {
  const insets = useSafeAreaInsets();
  const { data: appData } = useAppData();

  const months = useMemo(() => monthOptions(appData), [appData]);
  const options = useMemo(() => months.map(monthLabel), [months]);

  const [picked, setPicked] = useState<string | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);

  const month = picked && options.includes(picked) ? picked : options[0];
  const data = useMemo(
      () => buildReport(appData, months[options.indexOf(month)] ?? new Date()),
      [appData, months, options, month]
  );
  const profit = data.revenue - data.expenses;

  const tabBar = components.tabBar;
  const bottomSpace = tabBar.height + Math.max(insets.bottom, tabBar.horizontalInset) + 24;

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ThemedStatusBar />
        <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: bottomSpace }}
            showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Reports</Text>

          <TouchableOpacity style={styles.monthPill} activeOpacity={0.7} onPress={() => setMonthOpen(true)}>
            <Text style={styles.monthText}>{month}</Text>
            <Ionicons name="chevron-down" size={16} color={C.text} />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Financial Overview</Text>
            <View style={{ gap: 22, marginTop: 20 }}>
              <OverviewRow
                  icon="bar-chart-outline"
                  tint={{ bg: C.successBg, border: C.successBorder, fg: C.successFg }}
                  label="Revenue"
                  value={formatMoney(data.revenue)}
              />
              <OverviewRow
                  icon="trending-up"
                  tint={{ bg: C.dangerBg, border: C.dangerBorder, fg: C.dangerFg }}
                  label="Expenses"
                  value={formatMoney(data.expenses)}
              />
              <OverviewRow
                  icon="analytics-outline"
                  tint={{ bg: C.chipBg, border: C.chipBorder, fg: C.purpleSoft }}
                  label="Net Profit"
                  value={formatMoney(profit)}
              />
            </View>
          </View>

          <View style={{ height: 16 }} />
          <IncomeExpenseChart data={data} />
        </ScrollView>

        <SelectModal
            visible={monthOpen}
            title="Month"
            options={options}
            selected={month}
            onSelect={setPicked}
            onClose={() => setMonthOpen(false)}
        />
      </SafeAreaView>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  title: { color: C.text, fontSize: 22, fontWeight: "700" },

  monthPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 18,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  monthText: { color: C.text, fontSize: 15, fontWeight: "500" },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: "700" },

  ovRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  ovIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ovLabel: { color: C.text, fontSize: 14 },
  ovValue: { color: C.text, fontSize: 19, fontWeight: "700", marginTop: 4 },

  legend: { flexDirection: "row", justifyContent: "center", gap: 22, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: C.muted, fontSize: 13 },
}));
