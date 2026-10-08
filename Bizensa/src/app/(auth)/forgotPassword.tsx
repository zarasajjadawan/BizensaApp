import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";

import { API_URL } from "@/constants/api";
import { C } from "@/constants/theme";
import {
    AuthInput,
    AuthScreen,
    BackButton,
    FooterLink,
    Label,
    PrimaryButton,
    Title,
} from "@/components/auth-parts";

const RESEND_SECONDS = 60;

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

    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

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
            const r = await post("/api/auth/reset-password", { email, code, newPassword });

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
        <AuthScreen>
            <BackButton />
            <Title
                title="Reset Password"
                subtitle={
                    sent
                        ? "Enter the code we emailed you and choose a new password"
                        : "Enter your email and we'll send you a 6-digit code"
                }
            />

            {!sent ? (
                <>
                    <Label top={32}>Email</Label>
                    <AuthInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <PrimaryButton label="Send Code" loading={loading} onPress={sendCode} />
                </>
            ) : (
                <>
                    <View
                        style={{
                            marginTop: 32,
                            width: "100%",
                            backgroundColor: C.card,
                            borderWidth: 1,
                            borderColor: C.border,
                            borderRadius: 12,
                            padding: 16,
                        }}
                    >
                        <Text style={{ color: C.muted, fontSize: 14 }}>
                            If an account exists for{" "}
                            <Text style={{ color: C.text, fontWeight: "500" }}>{email}</Text>, a code is on its way.
                            It expires in 15 minutes.
                        </Text>
                    </View>

                    <Label top={24}>6-digit code</Label>
                    <AuthInput
                        value={code}
                        onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        keyboardType="number-pad"
                        maxLength={6}
                        style={{ letterSpacing: 6, fontSize: 18 }}
                    />

                    <Label>New Password</Label>
                    <AuthInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="At least 8 characters"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <Label>Confirm New Password</Label>
                    <AuthInput
                        value={confirm}
                        onChangeText={setConfirm}
                        placeholder="Re-enter new password"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <PrimaryButton label="Reset Password" loading={loading} onPress={resetPassword} />

                    <View
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: 20,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setSent(false);
                                setCode("");
                                setNewPassword("");
                                setConfirm("");
                            }}
                            disabled={loading}
                        >
                            <Text style={{ color: C.muted }}>Change email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={sendCode} disabled={loading || cooldown > 0}>
                            <Text style={{ color: cooldown > 0 ? C.muted : C.purpleSoft, fontWeight: "500" }}>
                                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <FooterLink>
                Remember your password?{" "}
                <Link href="/(auth)/sign-in" style={{ color: C.purpleSoft, fontWeight: "500" }}>
                    Login
                </Link>
            </FooterLink>
        </AuthScreen>
    );
};

export default ForgotPassword;
