import React, { useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { C, themedStyles } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import {
    STATUS_COLOR,
    STATUS_LABEL,
    authFetch,
    formatLongDate,
    formatMoney,
    invoiceStatus,
    useAppData,
} from "@/constants/api";

const Detail = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detail}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const TotalRow = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <View style={styles.totalRow}>
        <Text style={[styles.totalLabel, bold && styles.totalBold]}>{label}</Text>
        <Text style={[styles.totalValue, bold && styles.totalBold]}>{value}</Text>
    </View>
);

type Busy = "pay" | "delete" | null;

export default function InvoiceDetails() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Reloads every time this screen is focused
    const { data, loading, refresh } = useAppData();
    const [busy, setBusy] = useState<Busy>(null);

    const invoice = useMemo(() => data.invoices.find((i) => i._id === id), [data.invoices, id]);

    const status = invoice ? invoiceStatus(invoice) : "pending";
    const statusColor = STATUS_COLOR[status];
    const isPaid = status === "paid";

    /* ---------- Mark as paid ---------- */
    const confirmPay = async () => {
        if (!invoice || busy) return;
        setBusy("pay");
        try {
            const res = await authFetch(`/api/invoices/${invoice._id}/pay`, { method: "PATCH" });

            if (!res) {
                router.replace("/(auth)/sign-in");
                return;
            }

            const json = await res.json();
            if (!res.ok || json.success === false) {
                Alert.alert("Couldn't mark as paid", json.message ?? "Please try again.");
                return;
            }

            await refresh(); // shows "Paid" + paid date right away
        } catch (err) {
            console.log("Mark paid error:", err);
            Alert.alert("Couldn't mark as paid", "Check your connection and try again.");
        } finally {
            setBusy(null);
        }
    };

    const onPay = () => {
        Alert.alert("Mark as paid?", "This invoice will be marked as paid today.", [
            { text: "Cancel", style: "cancel" },
            { text: "Mark as Paid", onPress: confirmPay },
        ]);
    };

    /* ---------- Delete ---------- */
    const confirmDelete = async () => {
        if (!invoice || busy) return;
        setBusy("delete");
        try {
            const res = await authFetch(`/api/invoices/${invoice._id}`, { method: "DELETE" });

            if (!res) {
                router.replace("/(auth)/sign-in");
                return;
            }

            const json = await res.json();
            if (!res.ok || json.success === false) {
                Alert.alert("Couldn't delete invoice", json.message ?? "Please try again.");
                return;
            }

            router.back(); // the list reloads when it comes back into focus
        } catch (err) {
            console.log("Delete invoice error:", err);
            Alert.alert("Couldn't delete invoice", "Check your connection and try again.");
        } finally {
            setBusy(null);
        }
    };

    const onDelete = () => {
        Alert.alert("Delete invoice?", "This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: confirmDelete },
        ]);
    };

    /* ---------- Edit ---------- */
    const onEdit = () => {
        if (!invoice || busy) return;
        router.push({ pathname: "/create-invoice", params: { id: invoice._id } });
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top"]}>
            <Stack.Screen options={{ headerShown: false }} />
            <ThemedStatusBar />

            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.topLeft}
                    onPress={() => router.back()}
                    hitSlop={12}
                    disabled={!!busy}
                >
                    <Ionicons name="chevron-back" size={26} color={C.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Invoice Details</Text>
            </View>

            {!invoice ? (
                <Text style={styles.notFound}>{loading ? "Loading..." : "Invoice not found."}</Text>
            ) : (
                <>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.hero}>
                            <Text style={styles.number}>{invoice.invoiceNumber}</Text>
                            <Text style={styles.amount}>{formatMoney(invoice.total)}</Text>
                            <View
                                style={[styles.badge, { backgroundColor: statusColor + "22", borderColor: statusColor }]}
                            >
                                <Text style={[styles.badgeText, { color: statusColor }]}>
                                    {STATUS_LABEL[status]}
                                </Text>
                            </View>
                        </View>

                        <Detail label="Customer" value={invoice.customer || "-"} />
                        <Detail label="Issued" value={formatLongDate(invoice.createdAt)} />
                        <Detail label="Due Date" value={formatLongDate(invoice.dueDate)} />
                        {isPaid && (
                            <Detail
                                label="Paid On"
                                value={invoice.paidAt ? formatLongDate(invoice.paidAt) : "-"}
                            />
                        )}

                        <Text style={styles.sectionTitle}>Items</Text>
                        <View style={styles.card}>
                            {invoice.items.length === 0 ? (
                                <Text style={styles.empty}>No items.</Text>
                            ) : (
                                invoice.items.map((item, i) => (
                                    <View
                                        key={`${item.name}-${i}`}
                                        style={[styles.itemRow, i < invoice.items.length - 1 && styles.itemDivider]}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemMeta}>
                                                {item.qty} x {formatMoney(item.price)}
                                            </Text>
                                        </View>
                                        <Text style={styles.itemTotal}>{formatMoney(item.qty * item.price)}</Text>
                                    </View>
                                ))
                            )}
                        </View>

                        <View style={[styles.card, styles.totalsCard]}>
                            <TotalRow label="Subtotal" value={formatMoney(invoice.subtotal)} />
                            <TotalRow label="Tax" value={formatMoney(invoice.tax)} />
                            <View style={styles.totalDivider} />
                            <TotalRow label="Total" value={formatMoney(invoice.total)} bold />
                        </View>
                    </ScrollView>

                    <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                        {!isPaid && (
                            <TouchableOpacity
                                style={[styles.btn, styles.payBtn, !!busy && styles.btnDisabled]}
                                activeOpacity={0.85}
                                onPress={onPay}
                                disabled={!!busy}
                            >
                                {busy === "pay" ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                        <Text style={styles.payText}>Mark as Paid</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        <View style={styles.row}>
                            {!isPaid && (
                                <TouchableOpacity
                                    style={[styles.btn, styles.editBtn, !!busy && styles.btnDisabled]}
                                    activeOpacity={0.8}
                                    onPress={onEdit}
                                    disabled={!!busy}
                                >
                                    <Text style={styles.editText}>Edit</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.btn, styles.deleteBtn, !!busy && styles.btnDisabled]}
                                activeOpacity={0.8}
                                onPress={onDelete}
                                disabled={!!busy}
                            >
                                {busy === "delete" ? (
                                    <ActivityIndicator color={C.red} />
                                ) : (
                                    <Text style={styles.deleteText}>Delete</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = themedStyles((C) =>
    StyleSheet.create({
        safe: { flex: 1, backgroundColor: C.bg },

        topBar: { height: 52, alignItems: "center", justifyContent: "center" },
        topLeft: { position: "absolute", left: 14 },
        title: { color: C.text, fontSize: 18, fontWeight: "600" },

        scroll: { paddingHorizontal: 20, paddingBottom: 24 },
        notFound: { color: C.muted, textAlign: "center", marginTop: 60 },

        hero: { alignItems: "center", marginTop: 12, marginBottom: 28 },
        number: { color: C.muted, fontSize: 16, fontWeight: "600" },
        amount: { color: C.text, fontSize: 30, fontWeight: "700", marginTop: 8 },
        badge: {
            marginTop: 14,
            paddingHorizontal: 16,
            height: 30,
            borderRadius: 15,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
        },
        badgeText: { fontSize: 13, fontWeight: "700" },

        detail: { marginBottom: 20 },
        detailLabel: { color: C.text, fontSize: 15, fontWeight: "600" },
        detailValue: { color: C.muted, fontSize: 15, marginTop: 6 },

        sectionTitle: { color: C.text, fontSize: 15, fontWeight: "600", marginTop: 4, marginBottom: 10 },
        card: {
            backgroundColor: C.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 16,
        },
        empty: { color: C.muted, paddingVertical: 16 },

        itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
        itemDivider: { borderBottomWidth: 1, borderBottomColor: C.border },
        itemName: { color: C.text, fontSize: 15, fontWeight: "600" },
        itemMeta: { color: C.muted, fontSize: 13, marginTop: 4 },
        itemTotal: { color: C.text, fontSize: 15, fontWeight: "600" },

        totalsCard: { marginTop: 16, paddingVertical: 8 },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
        totalLabel: { color: C.muted, fontSize: 15 },
        totalValue: { color: C.text, fontSize: 15 },
        totalBold: { color: C.text, fontSize: 17, fontWeight: "700" },
        totalDivider: { height: 1, backgroundColor: C.border, marginVertical: 4 },

        actions: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
        row: { flexDirection: "row", gap: 14 },
        btn: {
            flex: 1,
            height: 52,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            borderWidth: 1,
        },
        btnDisabled: { opacity: 0.5 },
        payBtn: { flex: 0, alignSelf: "stretch", backgroundColor: C.purple, borderColor: C.purple },
        payText: { color: "#fff", fontSize: 16, fontWeight: "700" },
        editBtn: { backgroundColor: C.card, borderColor: C.border },
        editText: { color: C.text, fontSize: 16, fontWeight: "600" },
        deleteBtn: { backgroundColor: C.dangerBg, borderColor: C.red },
        deleteText: { color: C.red, fontSize: 16, fontWeight: "600" },
    })
);