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
import { authFetch, useCustomers } from "@/constants/api";

const initialsOf = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const Detail = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detail}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value?.trim() ? value : "-"}</Text>
  </View>
);

export default function CustomerDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { customers, loading } = useCustomers();
  const [deleting, setDeleting] = useState(false);

  const customer = useMemo(() => customers.find((c) => c._id === id), [customers, id]);

  const confirmDelete = async () => {
    if (!customer || deleting) return;

    try {
      setDeleting(true);

      const res = await authFetch(`/api/customers/${customer._id}`, { method: "DELETE" });

      if (!res) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const json = await res.json();

      if (!res.ok || json.success === false) {
        Alert.alert("Couldn't delete customer", json.message ?? "Please try again.");
        return;
      }

      // The list reloads when it comes back into focus
      router.back();
    } catch (err) {
      console.log("Delete customer error:", err);
      Alert.alert("Couldn't delete customer", "Check your connection and try again.");
    } finally {
      setDeleting(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      "Delete customer?",
      "This customer will be removed. Past invoices and income keep their name.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: confirmDelete },
      ]
    );
  };

  const onEdit = () => {
    if (!customer) return;
    router.push({ pathname: "/add-customer", params: { id: customer._id } });
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
          disabled={deleting}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Customer Details</Text>
      </View>

      {!customer ? (
        <Text style={styles.notFound}>{loading ? "Loading..." : "Customer not found."}</Text>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialsOf(customer.name)}</Text>
              </View>
              <Text style={styles.name}>{customer.name}</Text>
              {customer.businessName ? (
                <Text style={styles.business}>{customer.businessName}</Text>
              ) : null}
            </View>

            <Detail label="Phone" value={customer.phone} />
            <Detail label="Email" value={customer.email} />
            <Detail label="Business" value={customer.businessName} />
            <Detail label="Address" value={customer.address} />
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
  title: { color: C.text, fontSize: 18, fontWeight: "600" },

  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  notFound: { color: C.muted, textAlign: "center", marginTop: 60 },

  hero: { alignItems: "center", marginTop: 12, marginBottom: 28 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: C.chipBg,
    borderWidth: 2,
    borderColor: C.chipBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.purpleSoft, fontSize: 26, fontWeight: "700" },
  name: { color: C.text, fontSize: 24, fontWeight: "700", marginTop: 16 },
  business: { color: C.muted, fontSize: 16, marginTop: 6 },

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
  deleteBtn: { backgroundColor: C.dangerBg, borderColor: C.red },
  deleteText: { color: C.red, fontSize: 16, fontWeight: "600" },
}));
