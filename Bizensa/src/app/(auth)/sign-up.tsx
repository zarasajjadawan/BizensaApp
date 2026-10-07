import { useState } from "react";
import {
    Alert,
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import {API_URL} from "@/constants/api";

const SafeAreaView = styled(RNSafeAreaView);


// const API_URL = "http://localhost:3000";
// const API_URL = "http://192.168.90.60:3000";
// const API_URL = "http://127.0.0.1:4041";

const inputStyle = {
    width: "100%",
    color: "white",
    backgroundColor: "#171717",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#262626",
};

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

        if (
            !payload.name ||
            !payload.businessName ||
            !payload.email ||
            !payload.password
        ) {
            Alert.alert("Missing details", "Please fill in all fields.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(payload.email)) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }

        if (payload.password.length < 6) {
            Alert.alert(
                "Weak password",
                "Password must be at least 6 characters."
            );
            return;
        }

        if (!agreed) {
            Alert.alert(
                "Terms required",
                "Please accept the Terms & Conditions to continue."
            );
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            let data = {};
            try {
                data = await res.json();
            } catch (_) {}

            if (!res.ok || data?.success === false) {
                Alert.alert(
                    "Sign up failed",
                    data?.message || `Server error (${res.status})`
                );
                return;
            }

            const token = data?.data?.token;
            if (token) {
                await SecureStore.setItemAsync("token", token);
            }

            Alert.alert(
                "Success",
                data?.message || "Your account has been created.",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/(auth)/sign-in"),
                    },
                ]
            );
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
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{
                        flexGrow: 1,
                        width: "100%",
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        className="flex-1"
                        style={{
                            paddingHorizontal: 20,
                            width: "100%",
                        }}
                    >
                        {/* Back button */}
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="w-10 h-10 items-center justify-center -ml-2 mt-2"
                        >
                            <Ionicons
                                name="chevron-back"
                                color="#ffffff"
                                size={26}
                            />
                        </TouchableOpacity>

                        {/* Header */}
                        <View className="mt-6">
                            <Text className="text-white text-3xl font-bold">
                                Create Account
                            </Text>

                            <Text className="text-gray-400 text-base mt-1">
                                Let's get you started
                            </Text>
                        </View>

                        {/* Full Name */}
                        <View className="mt-8 w-full">
                            <Text className="text-white text-base mb-2">
                                Full Name
                            </Text>

                            <TextInput
                                value={form.fullName}
                                onChangeText={(t) =>
                                    setForm({ ...form, fullName: t })
                                }
                                placeholder="John Doe"
                                placeholderTextColor="#6b7280"
                                autoCorrect={false}
                                editable={!loading}
                                style={inputStyle}
                            />
                        </View>

                        {/* Business Name */}
                        <View className="mt-5 w-full">
                            <Text className="text-white text-base mb-2">
                                Business Name
                            </Text>

                            <TextInput
                                value={form.businessName}
                                onChangeText={(t) =>
                                    setForm({ ...form, businessName: t })
                                }
                                placeholder="Your business name"
                                placeholderTextColor="#6b7280"
                                autoCorrect={false}
                                editable={!loading}
                                style={inputStyle}
                            />
                        </View>

                        {/* Email */}
                        <View className="mt-5 w-full">
                            <Text className="text-white text-base mb-2">
                                Email
                            </Text>

                            <TextInput
                                value={form.email}
                                onChangeText={(t) =>
                                    setForm({ ...form, email: t })
                                }
                                placeholder="you@example.com"
                                placeholderTextColor="#6b7280"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                style={inputStyle}
                            />
                        </View>

                        {/* Password */}
                        <View className="mt-5 w-full">
                            <Text className="text-white text-base mb-2">
                                Password
                            </Text>

                            <View className="w-full flex-row items-center bg-neutral-900 rounded-xl border border-neutral-800 px-4">
                                <TextInput
                                    value={form.password}
                                    onChangeText={(t) =>
                                        setForm({ ...form, password: t })
                                    }
                                    placeholder="At least 6 characters"
                                    placeholderTextColor="#6b7280"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                    className="flex-1 text-white py-4"
                                />

                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="ml-2 p-1"
                                >
                                    <Ionicons
                                        name={
                                            showPassword
                                                ? "eye-off-outline"
                                                : "eye-outline"
                                        }
                                        size={22}
                                        color="#9ca3af"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Terms checkbox */}
                        <View className="flex-row items-center mt-5">
                            <TouchableOpacity
                                onPress={() => setAgreed(!agreed)}
                                className={`w-5 h-5 rounded-md items-center justify-center mr-3 ${
                                    agreed
                                        ? "bg-foreground"
                                        : "border border-neutral-700"
                                }`}
                            >
                                {agreed && (
                                    <Ionicons
                                        name="checkmark"
                                        color="#ffffff"
                                        size={14}
                                    />
                                )}
                            </TouchableOpacity>

                            <Text className="text-gray-400 text-sm">
                                I agree to{" "}
                                <Text className="text-[#7524E8] font-medium">
                                    Terms & Conditions
                                </Text>
                            </Text>
                        </View>

                        {/* Create Account Button */}
                        <TouchableOpacity
                            onPress={handleSignUp}
                            disabled={loading}
                            activeOpacity={0.8}
                            className={`w-full bg-foreground rounded-xl py-4 mt-8 items-center justify-center ${
                                loading ? "opacity-60" : ""
                            }`}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white text-center text-base font-semibold">
                                    Create Account
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Login */}
                        <View className="w-full items-center justify-center mt-8 mb-6">
                            <Text className="text-gray-400 text-center">
                                Already have an account?{" "}
                                <Link
                                    href="/(auth)/sign-in"
                                    className="text-[#7524E8] font-medium"
                                >
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

export default SignUp;
