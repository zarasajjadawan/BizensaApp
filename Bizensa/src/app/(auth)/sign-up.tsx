import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "@/constants/api";
import { C } from "@/constants/theme";
import {
    AuthInput,
    AuthScreen,
    BackButton,
    FooterLink,
    Label,
    PasswordInput,
    PrimaryButton,
    Title,
} from "@/components/auth-parts";

const SignUp = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(true);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        fullName: "",
        businessName: "",
        email: "",
        password: "",
    });

    const handleSignUp = async () => {
        if (loading) return;

        const payload = {
            name: form.fullName.trim(),
            businessName: form.businessName.trim(),
            email: form.email.trim().toLowerCase(),
            password: form.password,
        };

        if (!payload.name || !payload.businessName || !payload.email || !payload.password) {
            Alert.alert("Missing details", "Please fill in all fields.");
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }
        if (payload.password.length < 6) {
            Alert.alert("Weak password", "Password must be at least 6 characters.");
            return;
        }
        if (!agreed) {
            Alert.alert("Terms required", "Please accept the Terms & Conditions to continue.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            let data: any = {};
            try {
                data = await res.json();
            } catch (_) {}

            if (!res.ok || data?.success === false) {
                Alert.alert("Sign up failed", data?.message || `Server error (${res.status})`);
                return;
            }

            const token = data?.data?.token;
            if (token) await SecureStore.setItemAsync("token", token);

            Alert.alert("Success", data?.message || "Your account has been created.", [
                { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
            ]);
        } catch (err) {
            console.log("Sign up error:", err);
            Alert.alert(
                "Network error",
                "Could not reach the server. Check your API URL and that the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScreen>
            <BackButton />
            <Title title="Create Account" subtitle="Let's get you started" />

            <Label top={32}>Full Name</Label>
            <AuthInput
                value={form.fullName}
                onChangeText={(t) => setForm({ ...form, fullName: t })}
                placeholder="John Doe"
                autoCorrect={false}
                editable={!loading}
            />

            <Label>Business Name</Label>
            <AuthInput
                value={form.businessName}
                onChangeText={(t) => setForm({ ...form, businessName: t })}
                placeholder="Your business name"
                autoCorrect={false}
                editable={!loading}
            />

            <Label>Email</Label>
            <AuthInput
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <Label>Password</Label>
            <PasswordInput
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
                placeholder="At least 6 characters"
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                editable={!loading}
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
                <TouchableOpacity
                    onPress={() => setAgreed(!agreed)}
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        backgroundColor: agreed ? C.purple : "transparent",
                        borderWidth: agreed ? 0 : 1,
                        borderColor: C.border,
                    }}
                >
                    {agreed && <Ionicons name="checkmark" color="#ffffff" size={14} />}
                </TouchableOpacity>

                <Text style={{ color: C.muted, fontSize: 14 }}>
                    I agree to{" "}
                    <Text style={{ color: C.purpleSoft, fontWeight: "500" }}>Terms & Conditions</Text>
                </Text>
            </View>

            <PrimaryButton label="Create Account" loading={loading} onPress={handleSignUp} />

            <FooterLink>
                Already have an account?{" "}
                <Link href="/(auth)/sign-in" style={{ color: C.purpleSoft, fontWeight: "500" }}>
                    Login
                </Link>
            </FooterLink>
        </AuthScreen>
    );
};

export default SignUp;
