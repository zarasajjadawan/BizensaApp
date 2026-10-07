import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { SaveButton, ScreenShell, TextField } from "@/components/settings-parts";
import { authFetch, useCurrentUser } from "@/constants/api";

export default function BusinessDetails() {
  const router = useRouter();
  const { user } = useCurrentUser();

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setBusinessName(user.businessName ?? "");
      setBusinessType(user.businessType ?? "");
      setPhone(user.businessPhone ?? "");
      setAddress(user.businessAddress ?? "");
      setTaxNumber(user.taxNumber ?? "");
    }
  }, [user]);

  const save = async () => {
    if (!businessName.trim()) {
      Alert.alert("Enter a business name", "Business name is required.");
      return;
    }
    try {
      setSaving(true);
      // TODO: change this endpoint / body to match your backend
      const res = await authFetch("/api/business", {
        method: "PUT",
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          businessPhone: phone.trim(),
          businessAddress: address.trim(),
          taxNumber: taxNumber.trim(),
        }),
      });
      if (!res) {
        router.replace("/(auth)/sign-in");
        return;
      }
      const json = await res.json();
      if (!res.ok || json.success === false) {
        Alert.alert("Couldn't save changes", json.message ?? "Please try again.");
        return;
      }
      router.back();
    } catch (err) {
      console.log("Save business error:", err);
      Alert.alert("Couldn't save changes", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Business Details">
      <TextField
        label="Business Name"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="e.g. Zara Technologies"
        autoCapitalize="words"
      />
      <TextField
        label="Business Type (optional)"
        value={businessType}
        onChangeText={setBusinessType}
        placeholder="e.g. Software, Retail"
        autoCapitalize="words"
      />
      <TextField
        label="Business Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="e.g. 042 1234567"
        keyboardType="phone-pad"
      />
      <TextField
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="Street, city"
        multiline
        textAlignVertical="top"
        style={{ minHeight: 90, paddingTop: 14 }}
      />
      <TextField
        label="NTN / Tax Number (optional)"
        value={taxNumber}
        onChangeText={setTaxNumber}
        placeholder="e.g. 1234567-8"
        autoCapitalize="characters"
      />
      <SaveButton label="Save Changes" loading={saving} onPress={save} />
    </ScreenShell>
  );
}
