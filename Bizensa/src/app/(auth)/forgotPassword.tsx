import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
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
const OTP_LENGTH = 6;

type Step = "email" | "otp" | "reset";

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

/** 6 separate boxes backed by one hidden input (supports paste + autofill) */
const OtpBoxes = ({
                      value,
                      onChange,
                      inputRef,
                  }: {
    value: string;
    onChange: (v: string) => void;
    inputRef: React.RefObject<TextInput | null>;
}) => {
    const [focused, setFocused] = useState(false);
    const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

    return (
        <Pressable
            onPress={() => inputRef.current?.focus()}
            style={{ width: "100%", marginTop: 24 }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                {Array.from({ length: OTP_LENGTH }).map((_, i) => {
                    const isActive = focused && i === activeIndex;
                    return (
                        <View
                            key={i}
                            style={{
                                width: 48,
                                height: 58,
                                borderRadius: 12,
                                borderWidth: isActive ? 2 : 1,
                                borderColor: isActive ? C.purpleSoft : C.border,
                                backgroundColor: C.card,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Text style={{ color: C.text, fontSize: 24, fontWeight: "600" }}>
                                {value[i] ?? ""}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Hidden input that actually receives the typing */}
            <TextInput
                ref={inputRef}
                value={value}
                onChangeText={(t) => onChange(t.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                textContentType="oneTimeCode"
                autoComplete="sms-otp"
                caretHidden
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                }}
            />
        </Pressable>
    );
};

const ForgotPassword = () => {
    const router = useRouter();
    const otpRef = useRef<TextInput>(null);

    const [step, setStep] = useState<Step>("email");

    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");

    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    // Open the keyboard automatically on the OTP screen
    useEffect(() => {
        if (step !== "otp") return;
        const t = setTimeout(() => otpRef.current?.focus(), 300);
        return () => clearTimeout(t);
    }, [step]);

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
            setCode("");
            setStep("otp");
            setCooldown(RESEND_SECONDS);
        } catch (err) {
            console.log("Forgot password error:", err);
            Alert.alert("Couldn't send code", "Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    // The server checks the code together with the new password in the last step,
    // so this just makes sure all 6 digits are filled in and moves on.
    const continueToReset = () => {
        if (code.length !== OTP_LENGTH) {
            Alert.alert("Enter the code", "The code has 6 digits.");
            return;
        }
        setStep("reset");
    };

    const resetPassword = async () => {
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
                // Wrong / expired code → send the person back to re-enter it
                if (/code|attempt/i.test(r.message)) {
                    setCode("");
                    setStep("otp");
                }
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

    const subtitle =
        step === "email"
            ? "Enter your email and we'll send you a 6-digit code"
            : step === "otp"
                ? "Enter the 6-digit code we emailed you"
                : "Choose a new password for your account";

    const title = step === "otp" ? "Verify Code" : step === "reset" ? "New Password" : "Reset Password";

    return (
        <AuthScreen>
            {step === "email" ? (
                <BackButton />
            ) : (
                <TouchableOpacity
                    onPress={() => setStep(step === "reset" ? "otp" : "email")}
                    disabled={loading}
                >
                    <Text style={{ color: C.muted, fontSize: 15 }}>Back</Text>
                </TouchableOpacity>
            )}

            <Title title={title} subtitle={subtitle} />

            {/* ---------- Step 1: email ---------- */}
            {step === "email" && (
                <>
                    <Label top={32}>Email</Label>
                    <AuthInput
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <PrimaryButton label="Send Code" loading={loading} onPress={sendCode} />
                </>
            )}

            {/* ---------- Step 2: OTP (6 boxes) ---------- */}
            {step === "otp" && (
                <>
                    <View style={{ marginTop: 24, width: "100%" }}>
                        <Text style={{ color: C.muted, fontSize: 14 }}>
                            If an account exists for{" "}
                            <Text style={{ color: C.text, fontWeight: "500" }}>{email}</Text>, a code is on its way.
                            It expires in 15 minutes.
                        </Text>
                    </View>

                    <OtpBoxes value={code} onChange={setCode} inputRef={otpRef} />

                    <PrimaryButton label="Continue" loading={loading} onPress={continueToReset} />

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
                                setCode("");
                                setStep("email");
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

            {/* ---------- Step 3: new password ---------- */}
            {step === "reset" && (
                <>
                    <Label top={32}>New Password</Label>
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
