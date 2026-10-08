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
    FooterLink,
    Label,
    PasswordInput,
    PrimaryButton,
    Title,
} from "@/components/auth-parts";

const SignIn = () => {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (loading) return;

        if (!email.trim() || !password) {
            Alert.alert("Error", "Please enter your email and password");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "ngrok-skip-browser-warning": "true",
                },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                Alert.alert("Login failed", json.message || "Something went wrong");
                return;
            }

            const { token, user } = json.data;

            await SecureStore.setItemAsync("token", token);
            await SecureStore.setItemAsync("user", JSON.stringify(user));
            router.replace("/(tabs)");
        } catch (err) {
            console.log("Login error:", err);
            Alert.alert("Connection error", "Could not reach the server. Check your internet and the API URL.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthScreen>
            <Title title="Welcome Back! 👋" subtitle="Sign in to continue" />

            <Label top={32}>Email</Label>
            <AuthInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <Label>Password</Label>
            <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                editable={!loading}
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
            />

            <View style={{ marginTop: 12, alignSelf: "flex-end" }}>
                <Link href="/(auth)/forgotPassword" style={{ color: C.purpleSoft, fontWeight: "500", fontSize: 14 }}>
                    Forgot Password?
                </Link>
            </View>

            <PrimaryButton label="Sign In" loading={loading} onPress={handleSignIn} />

            <View style={{ width: "100%", flexDirection: "row", alignItems: "center", marginTop: 24 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
                <Text style={{ color: C.muted, marginHorizontal: 12 }}>OR</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>

            <TouchableOpacity
                style={{
                    width: "100%",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: C.card,
                    borderWidth: 1,
                    borderColor: C.border,
                    borderRadius: 12,
                    paddingVertical: 16,
                    marginTop: 24,
                }}
            >
                <Ionicons name="logo-google" size={20} color={C.text} />
                <Text style={{ color: C.text, fontSize: 16, fontWeight: "500", marginLeft: 8 }}>
                    Continue with Google
                </Text>
            </TouchableOpacity>

            <FooterLink>
                Don't have an account?{" "}
                <Link href="/(auth)/sign-up" style={{ color: C.purpleSoft, fontWeight: "500" }}>
                    Sign Up
                </Link>
            </FooterLink>
        </AuthScreen>
    );
};

export default SignIn;
