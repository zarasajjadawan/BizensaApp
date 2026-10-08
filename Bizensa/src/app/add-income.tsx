import React, { useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Field, ScreenHeader, SelectModal, formStyles as s } from "@/components/form-parts";
import { C, useAppTheme } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import { formatShortDateObj } from "@/constants/invoices";
import { API_URL, buildTransactions, useAppData, useCustomers } from "@/constants/api";
import { useCurrency } from "@/constants/currency";

const CATEGORIES = ["Sales", "Services", "Investment", "Interest", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank Account", "Credit Card", "Mobile Wallet"];
const NO_CUSTOMER = "No customer";

/**
 * Add income  -> open without params
 * Edit income -> open with params { id: "<transaction id>" }
 */
export default function AddIncome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customers } = useCustomers();
  const { symbol } = useCurrency();
  const { isDark } = useAppTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  // Only needed to find the transaction when editing
  const { data, loading } = useAppData();
  const existing = useMemo(
      () => (isEdit ? buildTransactions(data).find((t) => t.id === id) : undefined),
      [isEdit, data, id]
  );

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [customer, setCustomer] = useState(NO_CUSTOMER);
  const [date, setDate] = useState(new Date());
  const [payment, setPayment] = useState(PAYMENT_METHODS[1]);
  const [description, setDescription] = useState("");

  const [catOpen, setCatOpen] = useState(false);
  const [custOpen, setCustOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode: fill the form once with the saved income
  const filled = useRef(false);
  useEffect(() => {
    if (!existing || filled.current) return;
    filled.current = true;
    setAmount(String(existing.amount ?? ""));
    setCategory(existing.category || CATEGORIES[0]);
    setCustomer(existing.customer ? existing.customer : NO_CUSTOMER);
    setDate(existing.date ? new Date(existing.date) : new Date());
    setPayment(existing.paymentMethod || PAYMENT_METHODS[1]);
    setDescription(existing.description ?? "");
  }, [existing]);

  const save = async () => {
    const value = Number(amount.replace(/[^0-9.]/g, ""));
    if (!value || value <= 0) {
      Alert.alert("Enter an amount", "Income amount must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const res = await fetch(
          isEdit ? `${API_URL}/api/transactions/${id}` : `${API_URL}/api/income`,
          {
            method: isEdit ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
              amount: value,
              category,
              customer: customer === NO_CUSTOMER ? null : customer,
              date: date.toISOString(),
              paymentMethod: payment,
              description,
            }),
          }
      );
      const json = await res.json();

      if (res.ok && json.success === true) {
        Alert.alert(
            "Success",
            json.message ?? (isEdit ? "Income updated" : "Income saved"),
            [{ text: "OK", onPress: () => router.back() }],
            { cancelable: false }
        );
        return;
      }

      Alert.alert(isEdit ? "Couldn't update income" : "Couldn't save income", json.message ?? "Please try again.");
    } catch (err) {
      console.log("Save income error:", err);
      Alert.alert(
          isEdit ? "Couldn't update income" : "Couldn't save income",
          "Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Edit mode, transaction not loaded yet (or not found)
  if (isEdit && !existing) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
          <Stack.Screen options={{ headerShown: false }} />
          <ThemedStatusBar />
          <ScreenHeader title="Edit Income" />
          <Text style={{ color: C.muted, textAlign: "center", marginTop: 60 }}>
            {loading ? "Loading..." : "Income not found."}
          </Text>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedStatusBar />
        <ScreenHeader title={isEdit ? "Edit Income" : "Add Income"} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            <Field label="Income Amount">
              <View style={s.input}>
                <Text style={s.prefix}>{symbol}</Text>
                <TextInput
                    style={s.inputText}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                />
              </View>
            </Field>

            <Field label="Category">
              <TouchableOpacity style={s.input} activeOpacity={0.7} onPress={() => setCatOpen(true)}>
                <Text style={s.inputText}>{category}</Text>
                <Ionicons name="chevron-down" size={18} color={C.text} />
              </TouchableOpacity>
            </Field>

            <Field label="Customer (optional)">
              <TouchableOpacity style={s.input} activeOpacity={0.7} onPress={() => setCustOpen(true)}>
                <Text style={[s.inputText, customer === NO_CUSTOMER && { color: C.muted }]}>{customer}</Text>
                <Ionicons name="chevron-down" size={18} color={C.text} />
              </TouchableOpacity>
            </Field>

            <Field label="Date">
              <TouchableOpacity style={s.input} activeOpacity={0.7} onPress={() => setDateOpen(true)}>
                <Text style={s.inputText}>{formatShortDateObj(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={C.text} />
              </TouchableOpacity>
              {dateOpen && (
                  <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      themeVariant={isDark ? "dark" : "light"}
                      maximumDate={new Date()}
                      onChange={(_, d) => {
                        if (Platform.OS !== "ios") setDateOpen(false);
                        if (d) setDate(d);
                      }}
                  />
              )}
              {dateOpen && Platform.OS === "ios" && (
                  <TouchableOpacity style={s.doneBtn} onPress={() => setDateOpen(false)}>
                    <Text style={s.doneText}>Done</Text>
                  </TouchableOpacity>
              )}
            </Field>

            <Field label="Payment Method">
              <TouchableOpacity style={s.input} activeOpacity={0.7} onPress={() => setPayOpen(true)}>
                <Text style={s.inputText}>{payment}</Text>
                <Ionicons name="chevron-down" size={18} color={C.text} />
              </TouchableOpacity>
            </Field>

            <Field label="Description">
              <TextInput
                  style={[s.input, s.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Where did this income come from?"
                  placeholderTextColor={C.muted}
                  multiline
                  textAlignVertical="top"
              />
            </Field>

            <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={save}
                disabled={saving}
            >
              {saving ? (
                  <ActivityIndicator color="#fff" />
              ) : (
                  <Text style={s.saveText}>{isEdit ? "Update Income" : "Save Income"}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <SelectModal
            visible={catOpen}
            title="Category"
            options={CATEGORIES}
            selected={category}
            onSelect={setCategory}
            onClose={() => setCatOpen(false)}
        />
        <SelectModal
            visible={custOpen}
            title="Customer"
            options={[NO_CUSTOMER, ...customers.map((c) => c.name)]}
            selected={customer}
            onSelect={setCustomer}
            onClose={() => setCustOpen(false)}
        />
        <SelectModal
            visible={payOpen}
            title="Payment Method"
            options={PAYMENT_METHODS}
            selected={payment}
            onSelect={setPayment}
            onClose={() => setPayOpen(false)}
        />
      </SafeAreaView>
  );
}