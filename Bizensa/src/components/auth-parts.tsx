import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { C, useAppTheme } from "@/constants/theme";
import ThemedStatusBar from "@/components/themed-status-bar";

export const AuthScreen = ({ children }: { children: React.ReactNode }) => {
  useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <ThemedStatusBar />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, width: "100%" }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, paddingHorizontal: 20, width: "100%" }}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export const BackButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8, marginTop: 8 }}
    >
      <Ionicons name="chevron-back" color={C.text} size={26} />
    </TouchableOpacity>
  );
};

export const Title = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <View style={{ marginTop: 24 }}>
    <Text style={{ color: C.text, fontSize: 30, fontWeight: "700" }}>{title}</Text>
    <Text style={{ color: C.muted, fontSize: 16, marginTop: 4 }}>{subtitle}</Text>
  </View>
);

export const Label = ({ children, top = 20 }: { children: React.ReactNode; top?: number }) => (
  <Text style={{ color: C.text, fontSize: 16, marginTop: top, marginBottom: 8 }}>{children}</Text>
);

const boxStyle = () => ({
  backgroundColor: C.card,
  borderWidth: 1,
  borderColor: C.border,
  borderRadius: 12,
});

export const AuthInput = (props: TextInputProps) => (
  <TextInput
    placeholderTextColor={C.muted}
    {...props}
    style={[
      boxStyle(),
      { width: "100%", color: C.text, paddingHorizontal: 16, paddingVertical: 16 },
      props.style,
    ]}
  />
);

export const PasswordInput = ({
  show,
  onToggle,
  ...props
}: TextInputProps & { show: boolean; onToggle: () => void }) => (
  <View style={[boxStyle(), { width: "100%", flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }]}>
    <TextInput
      placeholderTextColor={C.muted}
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!show}
      style={{ flex: 1, color: C.text, paddingVertical: 16 }}
    />
    <TouchableOpacity onPress={onToggle} style={{ marginLeft: 8, padding: 4 }}>
      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color={C.muted} />
    </TouchableOpacity>
  </View>
);

export const PrimaryButton = ({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.8}
    style={{
      width: "100%",
      backgroundColor: C.purple,
      borderRadius: 12,
      paddingVertical: 16,
      marginTop: 32,
      alignItems: "center",
      justifyContent: "center",
      opacity: loading ? 0.7 : 1,
    }}
  >
    {loading ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>{label}</Text>
    )}
  </TouchableOpacity>
);

export const FooterLink = ({ children }: { children: React.ReactNode }) => (
  <View style={{ width: "100%", alignItems: "center", marginTop: 32, marginBottom: 24 }}>
    <Text style={{ color: C.muted, textAlign: "center" }}>{children}</Text>
  </View>
);
