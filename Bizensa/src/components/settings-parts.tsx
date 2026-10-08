import React from "react";
import { Stack } from "expo-router";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Field, FC, ScreenHeader, formStyles } from "@/components/form-parts";
import { themedStyles, useAppTheme } from "@/constants/theme";

/** Soft purple used for switches and checks in light mode. */
const LIGHT_MODE_ACCENT = "#b57bff";

/** Accent color for switches / checks: brand purple in dark, soft purple in light. */
const useAccent = () => {
  const { isDark } = useAppTheme(); // also re-renders this component on theme change
  return isDark ? FC.purple : LIGHT_MODE_ACCENT;
};

/* Rebuilt automatically for the current theme (unlike a plain StyleSheet.create). */
const styles = themedStyles((c) =>
    StyleSheet.create({
      group: {
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      },
      row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 18,
        paddingVertical: 14,
        minHeight: 58,
      },
      divider: { borderBottomWidth: 1, borderBottomColor: c.border },
      rowLabel: { color: c.text, fontSize: 15 },
      rowDesc: { color: c.muted, fontSize: 13, marginTop: 4 },
      radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: c.muted,
        alignItems: "center",
        justifyContent: "center",
      },
      hint: { color: c.muted, fontSize: 13, lineHeight: 19, marginTop: 14, paddingHorizontal: 4 },
    })
);

/* ---------- Page wrapper: safe area + back header + scrolling body ---------- */
export const ScreenShell = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: FC.bg }} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={FC.bg} />
        <ScreenHeader title={title} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

/* ---------- Text input with a label ---------- */
export const TextField = ({
                            label,
                            readOnly,
                            style,
                            ...props
                          }: TextInputProps & { label: string; readOnly?: boolean }) => {
  useAppTheme();
  return (
      <Field label={label}>
        <TextInput
            placeholderTextColor={FC.muted}
            editable={!readOnly}
            {...props}
            style={[formStyles.input, { color: readOnly ? FC.muted : FC.text, fontSize: 15 }, style]}
        />
      </Field>
  );
};

/* ---------- Purple save button ---------- */
export const SaveButton = ({
                             label,
                             loading,
                             onPress,
                           }: {
  label: string;
  loading?: boolean;
  onPress: () => void;
}) => (
    <TouchableOpacity
        style={[formStyles.saveBtn, loading && { opacity: 0.7 }]}
        activeOpacity={0.85}
        onPress={onPress}
        disabled={loading}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveText}>{label}</Text>}
    </TouchableOpacity>
);

/* ---------- Rounded card that holds rows ---------- */
export const Group = ({ children }: { children: React.ReactNode }) => {
  useAppTheme();
  return <View style={styles.group}>{children}</View>;
};

const RowText = ({ label, description }: { label: string; description?: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {description ? <Text style={styles.rowDesc}>{description}</Text> : null}
    </View>
);

/* ---------- Row with an on/off switch ---------- */
export const SwitchRow = ({
                            label,
                            description,
                            value,
                            onValueChange,
                            last,
                          }: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  last?: boolean;
}) => {
  const accent = useAccent();
  return (
      <View style={[styles.row, !last && styles.divider]}>
        <RowText label={label} description={description} />
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: FC.border, true: accent }}
            thumbColor="#fff"
            ios_backgroundColor={FC.border}
        />
      </View>
  );
};

/* ---------- Row you tap to choose it (radio style) ---------- */
export const OptionRow = ({
                            label,
                            description,
                            selected,
                            onPress,
                            last,
                          }: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  last?: boolean;
}) => {
  const accent = useAccent();
  return (
      <TouchableOpacity style={[styles.row, !last && styles.divider]} activeOpacity={0.7} onPress={onPress}>
        <RowText label={label} description={description} />
        <View style={[styles.radio, selected && { backgroundColor: accent, borderColor: accent }]}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
  );
};

export const Hint = ({ children }: { children: React.ReactNode }) => {
  useAppTheme();
  return <Text style={styles.hint}>{children}</Text>;
};