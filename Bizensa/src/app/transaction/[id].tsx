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
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { C, themedStyles } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import {
  API_URL,
  buildTransactions,
  deleteTransaction,
  formatLongDate,
  formatMoney,
  useAppData,
} from "@/constants/api";

const Detail = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
);

// "/uploads/abc.jpg" -> "https://your-server/uploads/abc.jpg"
const receiptSource = (url: string) => ({
  uri: /^https?:\/\//i.test(url) ? url : `${API_URL}${url}`,
  // ngrok free URLs show a warning page instead of the image without this header
  headers: { "ngrok-skip-browser-warning": "true" },
});

export default function TransactionDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, loading, refresh } = useAppData();
  const [deleting, setDeleting] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgFailed, setImgFailed] = useState(false);

  const tx = useMemo(
      () => buildTransactions(data).find((t) => t.id === id),
      [data, id]
  );

  const confirmDelete = async () => {
    if (!tx || deleting) return;

    setDeleting(true);
    try {
      await deleteTransaction(tx.id);
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
    if (!tx || deleting) return;
    router.push({
      pathname: tx.type === "income" ? "/add-income" : "/add-expense",
      params: { id: tx.id },
    });
  };

  const hasReceipt = !!tx && !!tx.receiptUrl;

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedStatusBar />

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
              <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

                {hasReceipt && (
                    <View style={styles.detail}>
                      <Text style={styles.detailLabel}>Receipt</Text>
                      <View style={styles.receiptBox}>
                        {imgFailed ? (
                            <View style={styles.receiptFallback}>
                              <Ionicons name="image-outline" size={28} color={C.muted} />
                              <Text style={styles.receiptFallbackText}>Couldn't load receipt</Text>
                            </View>
                        ) : (
                            <Image
                                source={receiptSource(tx.receiptUrl as string)}
                                style={styles.receiptImg}
                                resizeMode="contain"
                                onLoadEnd={() => setImgLoading(false)}
                                onError={() => {
                                  setImgLoading(false);
                                  setImgFailed(true);
                                }}
                            />
                        )}
                        {imgLoading && !imgFailed && (
                            <ActivityIndicator style={styles.receiptLoader} color={C.purple} />
                        )}
                      </View>
                    </View>
                )}
              </ScrollView>

              <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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

const styles = themedStyles((C) => StyleSheet.create({
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

  receiptBox: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    minHeight: 120,
    justifyContent: "center",
  },
  receiptImg: { width: "100%", height: 320 },
  receiptLoader: { position: "absolute", alignSelf: "center" },
  receiptFallback: { alignItems: "center", justifyContent: "center", paddingVertical: 32, gap: 8 },
  receiptFallbackText: { color: C.muted, fontSize: 14 },

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
  deleteBtn: { backgroundColor: C.dangerBg, borderColor: C.red },
  deleteText: { color: C.red, fontSize: 16, fontWeight: "600" },
}));