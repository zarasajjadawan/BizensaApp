import { useEffect, useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

import { API_URL } from "@/constants/api";

const SafeAreaView = styled(RNSafeAreaView);

const RESEND_SECONDS = 60;

const inputStyle = {
    width: "100%" as const,
    color: "white",
    backgroundColor: "#171717",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
};

/** POST helper for the public (no token) auth endpoints */
const post = async (path: string, body: object) => {
    const res = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return {
        ok: res.ok && json.success !== false,
        message: (json.message as string | undefined) ?? "Please try again.",
    };
};

const ForgotPassword = () => {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [sent, setSent] = useState(false); // false = enter email, true = enter code
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // Counts down the "Resend code" timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const sendCode = async () => {
        const value = email.trim().toLowerCase();

        if (!/^\S+@\S+\.\S+$/.test(value)) {
            Alert.alert("Enter a valid email", "Type the email you signed up with.");
            return;
        }

        try {
            setLoading(true);
            const r = await post("/api/auth/forgot-password", { email: value });

            if (!r.ok) {
                Alert.alert("Couldn't send code", r.message);
                return;
            }

            setEmail(value);
            setSent(true);
            setCooldown(RESEND_SECONDS);
        } catch (err) {
            console.log("Forgot password error:", err);
            Alert.alert("Couldn't send code", "Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async () => {
        if (!/^\d{6}$/.test(code)) {
            Alert.alert("Enter the code", "The code has 6 digits.");
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert("Password too short", "New password must be at least 8 characters.");
            return;
        }
        if (newPassword !== confirm) {
            Alert.alert("Passwords don't match", "Re-enter the new password in both fields.");
            return;
        }

        try {
            setLoading(true);
            const r = await post("/api/auth/reset-password", {
                email,
                code,
                newPassword,
            });

            if (!r.ok) {
                Alert.alert("Couldn't reset password", r.message);
                return;
            }

            Alert.alert("Password reset", "You can now log in with your new password.", [
                { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
            ]);
        } catch (err) {
            console.log("Reset password error:", err);
            Alert.alert("Couldn't reset password", "Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, width: "100%" }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-1" style={{ paddingHorizontal: 20, width: "100%" }}>
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center -ml-2 mt-2"
                        >
                            <Ionicons name="chevron-back" color="#ffffff" size={26} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View className="mt-6">
                            <Text className="text-white text-3xl font-bold">Reset Password</Text>

                            <Text className="text-gray-400 text-base mt-1">
                                {sent
                                    ? "Enter the code we emailed you and choose a new password"
                                    : "Enter your email and we'll send you a 6-digit code"}
                            </Text>
                        </View>

                        {!sent ? (
                            <>
                                {/* Email */}
                                <View className="mt-8 w-full">
                                    <Text className="text-white text-base mb-2">Email</Text>

                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="you@example.com"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={inputStyle}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={sendCode}
                                    disabled={loading}
                                    className="w-full bg-foreground rounded-xl py-4 mt-8"
                                    style={{ opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="text-white text-center text-base font-semibold">
                                            Send Code
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Info box */}
                                <View
                                    className="mt-8 w-full"
                                    style={{
                                        backgroundColor: "#171717",
                                        borderWidth: 1,
                                        borderColor: "#262626",
                                        borderRadius: 12,
                                        padding: 16,
                                    }}
                                >
                                    <Text className="text-gray-400 text-sm">
                                        If an account exists for{" "}
                                        <Text className="text-white font-medium">{email}</Text>, a code
                                        is on its way. It expires in 15 minutes.
                                    </Text>
                                </View>

                                {/* Code */}
                                <View className="mt-6 w-full">
                                    <Text className="text-white text-base mb-2">6-digit code</Text>
                                    <TextInput
                                        value={code}
                                        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                                        placeholder="123456"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        style={{ ...inputStyle, letterSpacing: 6, fontSize: 18 }}
                                    />
                                </View>

                                {/* New password */}
                                <View className="mt-5 w-full">
                                    <Text className="text-white text-base mb-2">New Password</Text>
                                    <TextInput
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="At least 8 characters"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        style={inputStyle}
                                    />
                                </View>

                                {/* Confirm */}
                                <View className="mt-5 w-full">
                                    <Text className="text-white text-base mb-2">Confirm New Password</Text>
                                    <TextInput
                                        value={confirm}
                                        onChangeText={setConfirm}
                                        placeholder="Re-enter new password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry
                                        autoCapitalize="none"
                                        style={inputStyle}
                                    />
                                </View>

                                <TouchableOpacity
                                    onPress={resetPassword}
                                    disabled={loading}
                                    className="w-full bg-foreground rounded-xl py-4 mt-8"
                                    style={{ opacity: loading ? 0.7 : 1 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text className="text-white text-center text-base font-semibold">
                                            Reset Password
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                {/* Resend + change email */}
                                <View className="w-full flex-row items-center justify-between mt-5">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSent(false);
                                            setCode("");
                                            setNewPassword("");
                                            setConfirm("");
                                        }}
                                        disabled={loading}
                                    >
                                        <Text className="text-gray-400">Change email</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        onPress={sendCode}
                                        disabled={loading || cooldown > 0}
                                    >
                                        <Text
                                            style={{
                                                color: cooldown > 0 ? "#6b7280" : "#7524E8",
                                                fontWeight: "500",
                                            }}
                                        >
                                            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* Back to Login */}
                        <View className="w-full items-center justify-center mt-8 mb-6">
                            <Text className="text-gray-400 text-center">
                                Remember your password?{" "}
                                <Link href="/(auth)/sign-in" className="text-[#7524E8] font-medium">
                                    Login
                                </Link>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ForgotPassword;
