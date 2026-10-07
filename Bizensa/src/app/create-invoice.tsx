import React, { useMemo, useState } from "react";
import * as SecureStore from "expo-secure-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { formatMoney } from "@/constants/transactions";
import { InvoiceItem, TAX_RATE, formatShortDateObj } from "@/constants/invoices";
import { API_URL, useCustomers } from "@/constants/api";

const T = Colors.dark;
const C = {
  bg: T.background,
  card: T.surface,
  border: T.border,
  purple: T.primary,
  purpleSoft: T.primarySoft,
  text: T.text,
  muted: T.textSecondary,
  red: T.danger,
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={styles.sumValue}>{value}</Text>
    </View>
);

export default function CreateInvoice() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customers } = useCustomers();

  const [customer, setCustomer] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d;
  });

  const [customerOpen, setCustomerOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // add-item form
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [itemPrice, setItemPrice] = useState("");

  const { subtotal, tax, total } = useMemo(() => {
    const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
    const t = Math.round(sub * TAX_RATE);
    return { subtotal: sub, tax: t, total: sub + t };
  }, [items]);

  const addItem = () => {
    const qty = parseInt(itemQty, 10);
    const price = Number(itemPrice.replace(/[^0-9.]/g, ""));
    if (!itemName.trim() || !qty || qty < 1 || !price) {
      Alert.alert("Check item details", "Enter a name, a quantity and a price.");
      return;
    }
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), name: itemName.trim(), qty, price },
    ]);
    setItemName("");
    setItemQty("1");
    setItemPrice("");
    setItemOpen(false);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const create = async () => {
    if (!customer) {
      Alert.alert("Select a customer", "Choose a customer or add one first.");
      return;
    }
    if (items.length === 0) {
      Alert.alert("Add an item", "An invoice needs at least one item.");
      return;
    }
    try {
      setSaving(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          customer,
          items: items.map(({ name, qty, price }) => ({ name, qty, price })),
          subtotal,
          tax,
          total,
          dueDate: dueDate.toISOString(),
        }),
      });
      const json = await res.json();

      if (res.ok && json.success === true) {
        Alert.alert(
            "Success",
            json.message ?? "Invoice created",
            [{ text: "OK", onPress: () => router.back() }],
            { cancelable: false }
        );
        return;
      }

      Alert.alert("Couldn't create invoice", json.message ?? "Please try again.");
    } catch (err) {
      console.log("Create invoice error:", err);
      Alert.alert("Couldn't create invoice", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        <View style={styles.topBar}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Create Invoice</Text>
        </View>

        <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
          {/* Customer */}
          <Text style={styles.label}>Customer</Text>
          <TouchableOpacity style={styles.input} activeOpacity={0.7} onPress={() => setCustomerOpen(true)}>
            <Text style={[styles.inputText, !customer && { color: C.muted }]}>
              {customer || "Select customer"}
            </Text>
            <Ionicons name="chevron-down" size={18} color={C.text} />
          </TouchableOpacity>

          {/* Items */}
          <Text style={[styles.label, { marginTop: 22 }]}>Items</Text>
          {items.length > 0 && (
              <View style={styles.itemsBox}>
                {items.map((it, idx) => (
                    <View key={it.id} style={[styles.itemRow, idx > 0 && styles.itemDivider]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{it.name}</Text>
                        <Text style={styles.itemQty}>Qty: {it.qty}</Text>
                      </View>
                      <View style={styles.itemRight}>
                        <TouchableOpacity hitSlop={10} onPress={() => removeItem(it.id)}>
                          <Ionicons name="close-circle-outline" size={18} color={C.muted} />
                        </TouchableOpacity>
                        <Text style={styles.itemPrice}>{formatMoney(it.qty * it.price)}</Text>
                      </View>
                    </View>
                ))}
              </View>
          )}
          <TouchableOpacity style={styles.addItem} activeOpacity={0.7} onPress={() => setItemOpen(true)}>
            <Ionicons name="add" size={20} color={C.purpleSoft} />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>

          {/* Summary */}
          <View style={styles.summary}>
            <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
            <SummaryRow label={`Tax (${TAX_RATE * 100}%)`} value={formatMoney(tax)} />
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(total)}</Text>
          </View>

          {/* Due date */}
          <Text style={[styles.label, { marginTop: 22 }]}>Due Date</Text>
          <TouchableOpacity style={styles.input} activeOpacity={0.7} onPress={() => setDateOpen(true)}>
            <Text style={styles.inputText}>{formatShortDateObj(dueDate)}</Text>
            <Ionicons name="calendar-outline" size={20} color={C.text} />
          </TouchableOpacity>
          {dateOpen && (
              <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  themeVariant="dark"
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    if (Platform.OS !== "ios") setDateOpen(false);
                    if (d) setDueDate(d);
                  }}
              />
          )}
          {dateOpen && Platform.OS === "ios" && (
              <TouchableOpacity style={styles.doneBtn} onPress={() => setDateOpen(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
          )}

          <TouchableOpacity
              style={[styles.createBtn, saving && { opacity: 0.7 }]}
              activeOpacity={0.85}
              onPress={create}
              disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create Invoice</Text>}
          </TouchableOpacity>
        </ScrollView>

        {/* Customer picker */}
        <Modal visible={customerOpen} transparent animationType="fade" onRequestClose={() => setCustomerOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setCustomerOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.sheetTitle}>Customer</Text>
              {customers.length === 0 && (
                  <Text style={styles.sheetTitle}>No customers yet. Add one first.</Text>
              )}
              {customers.map((cu) => (
                  <TouchableOpacity
                      key={cu._id}
                      style={styles.option}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCustomer(cu.name);
                        setCustomerOpen(false);
                      }}
                  >
                    <Text style={[styles.optionText, cu.name === customer && { color: C.purpleSoft }]}>
                      {cu.name}
                    </Text>
                    {cu.name === customer && <Ionicons name="checkmark" size={18} color={C.purpleSoft} />}
                  </TouchableOpacity>
              ))}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Add item form */}
        <Modal visible={itemOpen} transparent animationType="fade" onRequestClose={() => setItemOpen(false)}>
          <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Pressable style={styles.backdrop} onPress={() => setItemOpen(false)}>
              <Pressable style={styles.formSheet} onPress={() => {}}>
                <Text style={styles.sheetTitle}>New item</Text>

                <TextInput
                    style={styles.formInput}
                    value={itemName}
                    onChangeText={setItemName}
                    placeholder="Item name"
                    placeholderTextColor={C.muted}
                />
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TextInput
                      style={[styles.formInput, { flex: 1 }]}
                      value={itemQty}
                      onChangeText={setItemQty}
                      placeholder="Qty"
                      placeholderTextColor={C.muted}
                      keyboardType="number-pad"
                  />
                  <TextInput
                      style={[styles.formInput, { flex: 2 }]}
                      value={itemPrice}
                      onChangeText={setItemPrice}
                      placeholder="Price per unit (Rs)"
                      placeholderTextColor={C.muted}
                      keyboardType="numeric"
                  />
                </View>

                <TouchableOpacity style={styles.createBtn} activeOpacity={0.85} onPress={addItem}>
                  <Text style={styles.createText}>Add Item</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  topBar: { height: 52, alignItems: "center", justifyContent: "center" },
  back: { position: "absolute", left: 14 },
  title: { color: C.text, fontSize: 18, fontWeight: "600" },

  label: { color: C.text, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputText: { color: C.text, fontSize: 15 },

  itemsBox: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  itemRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  itemDivider: { borderTopWidth: 1, borderTopColor: C.border },
  itemName: { color: C.text, fontSize: 15, fontWeight: "600" },
  itemQty: { color: C.muted, fontSize: 13, marginTop: 6 },
  itemRight: { alignItems: "flex-end", gap: 8 },
  itemPrice: { color: C.text, fontSize: 13 },

  addItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  addItemText: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

  summary: { marginTop: 6, gap: 12 },
  sumRow: { flexDirection: "row", justifyContent: "space-between" },
  sumLabel: { color: C.muted, fontSize: 15 },
  sumValue: { color: C.text, fontSize: 15 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  totalLabel: { color: C.text, fontSize: 20, fontWeight: "700" },
  totalValue: { color: C.text, fontSize: 20, fontWeight: "700" },

  doneBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  doneText: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

  createBtn: {
    marginTop: 24,
    height: 54,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  createText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 28,
  },
  sheet: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 8,
  },
  formSheet: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  sheetTitle: { color: C.muted, fontSize: 13, paddingHorizontal: 4, paddingVertical: 6 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionText: { color: C.text, fontSize: 15 },
  formInput: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: C.text,
    fontSize: 15,
  },
});