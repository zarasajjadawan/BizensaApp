import React, { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
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

import { Field, ScreenHeader, formStyles as s } from "@/components/form-parts";
import { C, useAppTheme } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";
import { API_URL, useCustomers } from "@/constants/api";

export default function AddCustomer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  useAppTheme();

  // When an id is passed (from Customer Details > Edit) this screen edits that customer
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const { customers } = useCustomers();
  const filled = useRef(false);

  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Fill the form once with the saved values (edit mode only)
  useEffect(() => {
    if (!isEdit || filled.current) return;

    const c = customers.find((x) => x._id === id);
    if (!c) return;

    setName(c.name ?? "");
    setBusiness(c.businessName ?? "");
    setPhone(c.phone ?? "");
    setEmail(c.email ?? "");
    setAddress(c.address ?? "");
    filled.current = true;
  }, [isEdit, id, customers]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Enter a name", "Customer name is required.");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert("Check the email", "Enter a valid email address.");
      return;
    }

    try {
      setSaving(true);
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        router.replace("/(auth)/sign-in");
        return;
      }

      const res = await fetch(`${API_URL}/api/customers${isEdit ? `/${id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          name: name.trim(),
          businessName: business.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        Alert.alert("Couldn't save customer", json.message ?? "Please try again.");
        return;
      }
      router.back();
    } catch (err) {
      console.log("Save customer error:", err);
      Alert.alert("Couldn't save customer", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ThemedStatusBar />
        <ScreenHeader title={isEdit ? "Edit Customer" : "Add Customer"} />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            <Field label="Customer Name">
              <TextInput
                  style={[s.input, { color: C.text, fontSize: 15 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Smith"
                  placeholderTextColor={C.muted}
                  autoCapitalize="words"
              />
            </Field>

            <Field label="Business Name (optional)">
              <TextInput
                  style={[s.input, { color: C.text, fontSize: 15 }]}
                  value={business}
                  onChangeText={setBusiness}
                  placeholder="e.g. ABC Company"
                  placeholderTextColor={C.muted}
                  autoCapitalize="words"
              />
            </Field>

            <Field label="Phone">
              <TextInput
                  style={[s.input, { color: C.text, fontSize: 15 }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 0300 1234567"
                  placeholderTextColor={C.muted}
                  keyboardType="phone-pad"
              />
            </Field>

            <Field label="Email">
              <TextInput
                  style={[s.input, { color: C.text, fontSize: 15 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  placeholderTextColor={C.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
              />
            </Field>

            <Field label="Address">
              <TextInput
                  style={[s.input, s.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, city"
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
                  <Text style={s.saveText}>{isEdit ? "Save Changes" : "Save Customer"}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}
