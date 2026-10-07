import {View, Text, Image, Dimensions, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent,} from "react-native";
import { SafeAreaView as RNSafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";
import {styled} from "nativewind";
const SafeAreaView = styled(RNSafeAreaView)
import { router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useRef, useState} from "react";

const { width, height } = Dimensions.get("window");
const onboardingData = [
    {
        id: "1",
        title: "Track Expenses\nEffortlessly",
        description:
            "Track every expense and\nincome in one place.",
        image: require("../../assets/images/onboardingdarkone.png"),
        button: "Next",
    },

    {
        id: "2",
        title: "Get Insights",
        description:
            "Get clear insights of your\nbusiness finances.",
        image: require("../../assets/images/onboardingdarktwo.png"),
        button: "Next",
    },

    {
        id: "3",
        title: "Manage Everything",
        description:
            "Manage invoices, customers\nand reports easily.",
        image: require("../../assets/images/onboardingdarkthree.png"),
        button: "Get Started",
    },
];

const imageStyle = { width: width * 0.78, height: height * 0.42 };

export default function Onboarding() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const insets = useSafeAreaInsets();

    const flatListRef = useRef<FlatList>(null);

    const handleScroll = (
        event: NativeSyntheticEvent<NativeScrollEvent>
    ) => {
        const index = Math.round(
            event.nativeEvent.contentOffset.x / width
        );

        setCurrentIndex(index);
    };

    const nextScreen = async () => {
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            await AsyncStorage.setItem(
                "hasSeenOnboarding",
                "true"
            );
            router.replace("/sign-in");
        }
    };

    const skipOnboarding = async () => {
        await AsyncStorage.setItem(
            "hasSeenOnboarding",
            "true"
        );
        router.replace("/sign-in");
    };

    return (
        <SafeAreaView className="flex-1 bg-black" edges={["top", "bottom"]}>
            <FlatList
                ref={flatListRef}
                data={onboardingData}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <OnboardingItem item={item} />
                )}
            />
            {currentIndex !== 0 && (
                <TouchableOpacity
                    className="absolute right-[22px] z-10"
                    style={{ top: insets.top + 10 }}
                    onPress={skipOnboarding}
                >
                    <Text className="text-white text-sm font-sans-medium">Skip</Text>
                </TouchableOpacity>
            )}
            <View className="items-center pb-5">

                {/* Dots */}
                <View className="flex-row items-center mb-6">
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            className={
                                currentIndex === index
                                    ? "w-[9px] h-[9px] rounded-full bg-foreground mx-[5px]"
                                    : "w-[7px] h-[7px] rounded-full bg-[#55555D] mx-[5px]"
                            }
                        />
                    ))}
                </View>

                <TouchableOpacity
                    className="w-[82%] h-[50px] rounded-lg bg-foreground items-center justify-center"
                    onPress={nextScreen}
                >
                    <Text className="text-white text-[15px] font-sans-semibold">
                        {onboardingData[currentIndex].button}
                    </Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

function OnboardingItem({ item }: any) {
    return (
        <View style={{ width }} className="flex-1 items-center justify-center">
            <View className="w-full items-center justify-center">
                <Image source={item.image} style={imageStyle} resizeMode="contain"/>
            </View>
            <View className="w-[88%] items-center mt-[3%]">
                <Text className="text-white text-[25px] leading-6 text-center font-sans-bold">
                    {item.title}
                </Text>

                <Text className="text-[#A7A7AC] text-[15px] leading-5 text-center mt-2.5 font-sans-regular">
                    {item.description}
                </Text>
            </View>
        </View>
    );
}
