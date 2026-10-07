import { useState } from "react";
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
import * as SecureStore from "expo-secure-store";
import {API_URL} from "@/constants/api";

const SafeAreaView = styled(RNSafeAreaView);


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
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password,
                }),
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
            Alert.alert(
                "Connection error",
                "Could not reach the server. Check your internet and the API URL."
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
                    contentContainerStyle={{ flexGrow: 1, width: "100%" }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        className="flex-1"
                        style={{ paddingHorizontal: 20, width: "100%" }}
                    >
                        {/* Header */}
                        <View className="mt-6">
                            <Text className="text-white text-3xl font-bold">
                                Welcome Back! 👋
                            </Text>
                            <Text className="text-gray-400 text-base mt-1">
                                Sign in to continue
                            </Text>
                        </View>

                        {/* Email */}
                        <View className="mt-8 w-full">
                            <Text className="text-white text-base mb-2">Email</Text>

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email"
                                placeholderTextColor="#6b7280"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={!loading}
                                style={{
                                    width: "100%",
                                    color: "white",
                                    backgroundColor: "#171717",
                                    paddingHorizontal: 16,
                                    paddingVertical: 16,
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: "#262626",
                                }}
                            />
                        </View>

                        {/* Password */}
                        <View className="mt-5 w-full">
                            <Text className="text-white text-base mb-2">Password</Text>

                            <View className="w-full flex-row items-center bg-neutral-900 rounded-xl border border-neutral-800 px-4">
                                <TextInput
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Password"
                                    placeholderTextColor="#6b7280"
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    editable={!loading}
                                    onSubmitEditing={handleSignIn}
                                    returnKeyType="go"
                                    className="flex-1 text-white py-4"
                                />

                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="ml-2 p-1"
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color="#9ca3af"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot Password */}
                        <View className="mt-3 self-end">
                            <Link
                                href="/(auth)/forgotPassword"
                                className="text-[#7524E8] font-medium text-sm"
                            >
                                Forgot Password?
                            </Link>
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleSignIn}
                            disabled={loading}
                            activeOpacity={0.8}
                            className="w-full bg-foreground rounded-xl py-4 mt-8 items-center justify-center"
                            style={{ opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-center text-base font-semibold">
                                    Sign In
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* OR Divider */}
                        <View className="w-full flex-row items-center mt-6">
                            <View className="flex-1 h-[1px] bg-neutral-800" />
                            <Text className="text-gray-500 mx-3">OR</Text>
                            <View className="flex-1 h-[1px] bg-neutral-800" />
                        </View>

                        {/* Google Button */}
                        <TouchableOpacity className="w-full flex-row items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl py-4 mt-6">
                            <Ionicons name="logo-google" size={20} color="white" />
                            <Text className="text-white text-base font-medium ml-2">
                                Continue with Google
                            </Text>
                        </TouchableOpacity>

                        {/* Sign Up */}
                        <View className="w-full items-center justify-center mt-8 mb-6">
                            <Text className="text-gray-400 text-center">
                                Don't have an account?{" "}
                                <Link
                                    href="/(auth)/sign-up"
                                    className="text-[#7524E8] font-medium"
                                >
                                    Sign Up
                                </Link>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
