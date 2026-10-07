import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { Stack, useRouter } from "expo-router";
import {
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Field, FC, ScreenHeader, formStyles as s } from "@/components/form-parts";
import { API_URL } from "@/constants/api";

export default function AddCustomer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

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

      const res = await fetch(`${API_URL}/api/customers`, {
        method: "POST",
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
      <SafeAreaView style={{ flex: 1, backgroundColor: FC.bg }} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor={FC.bg} />
        <ScreenHeader title="Add Customer" />

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            <Field label="Customer Name">
              <TextInput
                  style={[s.input, { color: FC.text, fontSize: 15 }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. John Smith"
                  placeholderTextColor={FC.muted}
                  autoCapitalize="words"
              />
            </Field>

            <Field label="Business Name (optional)">
              <TextInput
                  style={[s.input, { color: FC.text, fontSize: 15 }]}
                  value={business}
                  onChangeText={setBusiness}
                  placeholder="e.g. ABC Company"
                  placeholderTextColor={FC.muted}
                  autoCapitalize="words"
              />
            </Field>

            <Field label="Phone">
              <TextInput
                  style={[s.input, { color: FC.text, fontSize: 15 }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 0300 1234567"
                  placeholderTextColor={FC.muted}
                  keyboardType="phone-pad"
              />
            </Field>

            <Field label="Email">
              <TextInput
                  style={[s.input, { color: FC.text, fontSize: 15 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@company.com"
                  placeholderTextColor={FC.muted}
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
                  placeholderTextColor={FC.muted}
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
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveText}>Save Customer</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}
