import { useState } from "react";
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
const SafeAreaView = styled(RNSafeAreaView)
import { Ionicons } from "@expo/vector-icons";

const forgetPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);

    const handleReset = () => {
        // TODO: hook up your actual reset-password API call here
        setSent(true);
    };

    return (
        <SafeAreaView
            className="flex-1 bg-black"
            edges={["top", "bottom"]}
        >
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
                            <Ionicons name="chevron-back" color="#ffffff" size={26} />
                        </TouchableOpacity>


                        {/* Header */}
                        <View className="mt-6">
                            <Text className="text-white text-3xl font-bold">
                                Reset Password
                            </Text>

                            <Text className="text-gray-400 text-base mt-1">
                                {sent
                                    ? "Check your inbox for a reset link"
                                    : "Enter your email and we'll send you a reset link"}
                            </Text>
                        </View>

                        {!sent ? (
                            <>
                                {/* Email */}
                                <View className="mt-8 w-full">
                                    <Text className="text-white text-base mb-2">
                                        Email
                                    </Text>

                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholderTextColor="#6b7280"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
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

                                {/* Send Reset Link Button */}
                                <TouchableOpacity
                                    onPress={handleReset}
                                    className="
                                        w-full
                                        bg-foreground
                                        rounded-xl
                                        py-4
                                        mt-8
                                    "
                                >
                                    <Text className="text-white text-center text-base font-semibold">
                                        Send Reset Link
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Success state */}
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
                                        We've sent a password reset link to{" "}
                                        <Text className="text-white font-medium">
                                            {email}
                                        </Text>
                                    </Text>
                                </View>

                                {/* Resend */}
                                <TouchableOpacity
                                    onPress={handleReset}
                                    className="
                                        w-full
                                        bg-foreground
                                        rounded-xl
                                        py-4
                                        mt-6
                                    "
                                >
                                    <Text className="text-white text-center text-base font-semibold">
                                        Resend Link
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Back to Login */}
                        <View className="w-full items-center justify-center mt-8 mb-6">
                            <Text className="text-gray-400 text-center">
                                Remember your password?{" "}
                                <Link
                                    href="/(auth)/sign-in"
                                    className="text-[#7524E8] font-medium"
                                >
                                    Login
                                </Link>
                            </Text>
                        </View>
                        {/*/!* Image *!/*/}
                        {/*<View className="w-full items-center justify-center flex-1">*/}
                        {/*    <Image*/}
                        {/*        source={require("../../assets/images/ForgetPasswordImage.png")}*/}
                        {/*        style={{*/}
                        {/*            width: 240,*/}
                        {/*            height: 240,*/}
                        {/*        }}*/}
                        {/*        resizeMode="contain"*/}
                        {/*    />*/}
                        {/*</View>*/}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default forgetPassword;
