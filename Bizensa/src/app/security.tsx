import React, { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { Hint, SaveButton, ScreenShell, TextField } from "@/components/settings-parts";
import { authFetch } from "@/constants/api";

export default function Security() {
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!current) {
      Alert.alert("Enter current password", "We need your current password to make this change.");
      return;
    }
    if (next.length < 8) {
      Alert.alert("Password too short", "New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      Alert.alert("Passwords don't match", "Re-enter the new password in both fields.");
      return;
    }

    try {
      setSaving(true);
      // TODO: change this endpoint / body to match your backend
      const res = await authFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res) {
        router.replace("/(auth)/sign-in");
        return;
      }
      const json = await res.json();
      if (!res.ok || json.success === false) {
        Alert.alert("Couldn't change password", json.message ?? "Please try again.");
        return;
      }
      Alert.alert("Password updated", "Use your new password next time you sign in.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log("Change password error:", err);
      Alert.alert("Couldn't change password", "Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenShell title="Security">
      <TextField
        label="Current Password"
        value={current}
        onChangeText={setCurrent}
        placeholder="Current password"
        secureTextEntry
        autoCapitalize="none"
      />
      <TextField
        label="New Password"
        value={next}
        onChangeText={setNext}
        placeholder="At least 8 characters"
        secureTextEntry
        autoCapitalize="none"
      />
      <TextField
        label="Confirm New Password"
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Re-enter new password"
        secureTextEntry
        autoCapitalize="none"
      />
      <SaveButton label="Update Password" loading={saving} onPress={save} />
      <Hint>Use a password you don't use anywhere else.</Hint>
    </ScreenShell>
  );
}
