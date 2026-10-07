import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors } from "@/constants/theme";
import { API_URL } from "@/constants/api";
import { useCurrency } from "@/constants/currency";

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
};

const CATEGORIES = ["Office", "Travel", "Food", "Utilities", "Salaries", "Marketing", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank Account", "Credit Card", "Mobile Wallet"];

const formatDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(
        /^(\d+) (\w+) (\d+)$/,
        "$1 $2, $3"
    );

/* ---------- Reusable pieces ---------- */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
);

const SelectModal = ({
                       visible,
                       title,
                       options,
                       selected,
                       onSelect,
                       onClose,
                     }: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  onClose: () => void;
}) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map((o) => (
              <TouchableOpacity
                  key={o}
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(o);
                    onClose();
                  }}
              >
                <Text style={[styles.optionText, o === selected && { color: C.purpleSoft }]}>{o}</Text>
                {o === selected && <Ionicons name="checkmark" size={18} color={C.purpleSoft} />}
              </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
);

/* ---------- Screen ---------- */
export default function AddExpense() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { symbol } = useCurrency();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(new Date());
  const [payment, setPayment] = useState(PAYMENT_METHODS[1]);
  const [description, setDescription] = useState("");
  const [receipt, setReceipt] = useState<string | null>(null);

  const [catOpen, setCatOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickReceipt = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to attach a receipt.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!res.canceled) setReceipt(res.assets[0].uri);
  };

  const save = async () => {
    const value = Number(amount.replace(/[^0-9.]/g, ""));
    if (!value || value <= 0) {
      Alert.alert("Enter an amount", "Expense amount must be greater than 0.");
      return;
    }

    try {
      setSaving(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const form = new FormData();
      form.append("amount", String(value));
      form.append("category", category);
      form.append("date", date.toISOString());
      form.append("paymentMethod", payment);
      form.append("description", description);
      if (receipt) {
        form.append("receipt", {
          uri: receipt,
          name: "receipt.jpg",
          type: "image/jpeg",
        } as any);
      }

      const res = await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: form,
      });
      const json = await res.json();

      if (res.ok && json.success === true) {
        Alert.alert(
            "Success",
            json.message ?? "Expense saved",
            [{ text: "OK", onPress: () => router.back() }],
            { cancelable: false }
        );
        return;
      }

      Alert.alert("Couldn't save expense", json.message ?? "Please try again.");
    } catch (err) {
      console.log("Save expense error:", err);
      Alert.alert("Couldn't save expense", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
              contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            <Field label="Expense Amount">
              <View style={styles.input}>
                <Text style={styles.prefix}>{symbol}</Text>
                <TextInput
                    style={styles.inputText}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                />
              </View>
            </Field>

            <Field label="Category">
              <TouchableOpacity style={styles.input} activeOpacity={0.7} onPress={() => setCatOpen(true)}>
                <Text style={styles.inputText}>{category}</Text>
                <Ionicons name="chevron-down" size={18} color={C.text} />
              </TouchableOpacity>
            </Field>

            <Field label="Date">
              <TouchableOpacity style={styles.input} activeOpacity={0.7} onPress={() => setDateOpen(true)}>
                <Text style={styles.inputText}>{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color={C.text} />
              </TouchableOpacity>
              {dateOpen && (
                  <DateTimePicker
                      value={date}
                      mode="date"
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      themeVariant="dark"
                      maximumDate={new Date()}
                      onChange={(_, d) => {
                        if (Platform.OS !== "ios") setDateOpen(false);
                        if (d) setDate(d);
                      }}
                  />
              )}
              {dateOpen && Platform.OS === "ios" && (
                  <TouchableOpacity style={styles.doneBtn} onPress={() => setDateOpen(false)}>
                    <Text style={styles.doneText}>Done</Text>
                  </TouchableOpacity>
              )}
            </Field>

            <Field label="Payment Method">
              <TouchableOpacity style={styles.input} activeOpacity={0.7} onPress={() => setPayOpen(true)}>
                <Text style={styles.inputText}>{payment}</Text>
                <Ionicons name="chevron-down" size={18} color={C.text} />
              </TouchableOpacity>
            </Field>

            <Field label="Description">
              <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What was this expense for?"
                  placeholderTextColor={C.muted}
                  multiline
                  textAlignVertical="top"
              />
            </Field>

            <Field label="Receipt">
              {receipt ? (
                  <View style={styles.receiptBox}>
                    <Image source={{ uri: receipt }} style={styles.receiptImg} />
                    <TouchableOpacity style={styles.removeReceipt} onPress={() => setReceipt(null)}>
                      <Ionicons name="close" size={16} color={C.text} />
                    </TouchableOpacity>
                  </View>
              ) : (
                  <TouchableOpacity style={[styles.input, styles.center]} activeOpacity={0.7} onPress={pickReceipt}>
                    <Ionicons name="add" size={20} color={C.purpleSoft} />
                    <Text style={styles.addReceipt}>Add Receipt</Text>
                  </TouchableOpacity>
              )}
            </Field>

            <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={save}
                disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Expense</Text>}
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

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  topBar: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  back: { position: "absolute", left: 14 },
  title: { color: C.text, fontSize: 18, fontWeight: "600" },

  field: { marginBottom: 18 },
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
  inputText: { color: C.text, fontSize: 15, flex: 1 },
  prefix: { color: C.text, fontSize: 15, marginRight: 6 },
  textArea: { minHeight: 90, alignItems: "flex-start", paddingTop: 14, color: C.text, fontSize: 15 },
  center: { justifyContent: "center", gap: 6 },
  addReceipt: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

  receiptBox: { borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: C.border },
  receiptImg: { width: "100%", height: 160 },
  removeReceipt: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  doneBtn: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 4 },
  doneText: { color: C.purpleSoft, fontSize: 15, fontWeight: "600" },

  saveBtn: {
    marginTop: 12,
    height: 54,
    borderRadius: 14,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },

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
  sheetTitle: { color: C.muted, fontSize: 13, paddingHorizontal: 18, paddingVertical: 10 },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionText: { color: C.text, fontSize: 15 },
});
