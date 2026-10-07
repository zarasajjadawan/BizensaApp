import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";

export default function Index() {
    const [loading, setLoading] = useState(true);
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const value = await AsyncStorage.getItem("hasSeenOnboarding");

                setHasSeenOnboarding(value === "true");
            } catch (error) {
                console.log("Error checking onboarding:", error);
            } finally {
                setLoading(false);
            }
        };

        checkOnboarding();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 bg-[#050608] items-center justify-center">
                <ActivityIndicator color="#8B2DFF" />
            </View>
        );
    }

    if (hasSeenOnboarding) {
        return <Redirect href="/sign-in" />;
    }

    return <Redirect href="/onboarding" />;
}