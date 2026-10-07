import React, { useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import {
  buildTransactions,
  deleteTransaction,
  formatLongDate,
  formatMoney,
  useAppData,
} from "@/constants/api";

const T = Colors.dark;
const C = {
  bg: T.background,
  card: T.surface,
  border: T.border,
  text: T.text,
  muted: T.textSecondary,
  green: T.success,
  red: T.danger,
};

const Detail = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
);

export default function TransactionDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, refresh } = useAppData();

  const [deleting, setDeleting] = useState(false);

  const tx = useMemo(
      () => buildTransactions(data).find((t) => t.id === id),
      [data, id]
  );

  const confirmDelete = async () => {
    if (!tx || deleting) return;

    setDeleting(true);
    try {
      await deleteTransaction(tx.id);

      // Reload the dashboard / lists so the deleted item disappears everywhere
      await refresh();

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not delete transaction");
    } finally {
      setDeleting(false);
    }
  };

  const onDelete = () => {
    Alert.alert("Delete transaction?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: confirmDelete },
    ]);
  };

  const onEdit = () => {
    // TODO: open an edit screen (e.g. /add-expense with the transaction id)
  };

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.topBar}>
          <TouchableOpacity
              style={styles.topLeft}
              onPress={() => router.back()}
              hitSlop={12}
              disabled={deleting}
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Transaction Details</Text>
          <TouchableOpacity style={styles.topRight} hitSlop={12}>
            <Ionicons name="ellipsis-vertical" size={20} color={C.text} />
          </TouchableOpacity>
        </View>

        {!tx ? (
            <Text style={styles.notFound}>
              {loading ? "Loading..." : "Transaction not found."}
            </Text>
        ) : (
            <>
              <ScrollView
                  contentContainerStyle={styles.scroll}
                  showsVerticalScrollIndicator={false}
              >
                <View style={styles.hero}>
                  <View
                      style={[
                        styles.heroIcon,
                        { backgroundColor: tx.type === "income" ? C.green : C.red },
                      ]}
                  >
                    <Ionicons
                        name={tx.type === "income" ? "arrow-up" : "arrow-down"}
                        size={22}
                        color="#fff"
                    />
                  </View>
                  <Text style={styles.amount}>
                    {tx.type === "income" ? "+" : "-"} {formatMoney(tx.amount)}
                  </Text>
                  <Text style={styles.heroTitle}>{tx.title}</Text>
                </View>

                <Detail label="Category" value={tx.category} />
                <Detail label="Date" value={formatLongDate(tx.date)} />
                <Detail label="Payment Method" value={tx.paymentMethod} />
                {tx.type === "income" && tx.customer ? (
                    <Detail label="Customer" value={tx.customer} />
                ) : null}
                <Detail label="Description" value={tx.description || "-"} />
              </ScrollView>

              <View
                  style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}
              >
                <TouchableOpacity
                    style={[styles.btn, styles.editBtn, deleting && styles.btnDisabled]}
                    activeOpacity={0.8}
                    onPress={onEdit}
                    disabled={deleting}
                >
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.btn, styles.deleteBtn, deleting && styles.btnDisabled]}
                    activeOpacity={0.8}
                    onPress={onDelete}
                    disabled={deleting}
                >
                  {deleting ? (
                      <ActivityIndicator color={C.red} />
                  ) : (
                      <Text style={styles.deleteText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  topBar: { height: 52, alignItems: "center", justifyContent: "center" },
  topLeft: { position: "absolute", left: 14 },
  topRight: { position: "absolute", right: 18 },
  title: { color: C.text, fontSize: 18, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  notFound: { color: C.muted, textAlign: "center", marginTop: 60 },

  hero: { alignItems: "center", marginTop: 12, marginBottom: 28 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  amount: { color: C.text, fontSize: 28, fontWeight: "700", marginTop: 16 },
  heroTitle: { color: C.muted, fontSize: 17, marginTop: 8 },

  detail: { marginBottom: 20 },
  detailLabel: { color: C.text, fontSize: 15, fontWeight: "600" },
  detailValue: { color: C.muted, fontSize: 15, marginTop: 6 },

  actions: { flexDirection: "row", gap: 14, paddingHorizontal: 20, paddingTop: 12 },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  btnDisabled: { opacity: 0.5 },
  editBtn: { backgroundColor: C.card, borderColor: C.border },
  editText: { color: C.text, fontSize: 16, fontWeight: "600" },
  deleteBtn: { backgroundColor: "#1c0a0c", borderColor: C.red },
  deleteText: { color: C.red, fontSize: 16, fontWeight: "600" },
});
