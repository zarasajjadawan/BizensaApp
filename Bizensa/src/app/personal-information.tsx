import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { SaveButton, ScreenShell, TextField } from "@/components/settings-parts";
import { authFetch, useCurrentUser } from "@/constants/api";

export default function PersonalInformation() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Enter your name", "Full name is required.");
      return;
    }
    try {
      setSaving(true);
      // TODO: change this endpoint / body to match your backend
      const res = await authFetch("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: name.trim() }),
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
      console.log("Save personal info error:", err);
      Alert.alert("Couldn't save changes", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
      <ScreenShell title="Personal Information">
        <TextField
            label="Full Name"
            value={loading ? "Loading..." : name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
        />
        <TextField label="Email" value={user?.email ?? ""} readOnly />
        <SaveButton label="Save Changes" loading={saving} onPress={save} />
      </ScreenShell>
  );
}
