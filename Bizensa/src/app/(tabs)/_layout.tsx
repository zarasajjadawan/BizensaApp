import { Tabs } from "expo-router";
import { View } from "react-native";
import clsx from "clsx";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, components } from "@/constants/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type TabConfig = {
    name: string;
    title: string;
    icon: IconName;
    iconActive: IconName;
};

const TABS: TabConfig[] = [
    { name: "index", title: "Home", icon: "home-outline", iconActive: "home" },
    { name: "transactions", title: "Transactions", icon: "swap-horizontal-outline", iconActive: "swap-horizontal" },
    { name: "invoices", title: "Invoices", icon: "document-text-outline", iconActive: "document-text" },
    { name: "reports", title: "Reports", icon: "bar-chart-outline", iconActive: "bar-chart" },
    { name: "profile", title: "Profile", icon: "person-outline", iconActive: "person" },
];

const tabBar = components.tabBar;
const colors = Colors.dark;

const TabIcon = ({ focused, tab }: { focused: boolean; tab: TabConfig }) => (
    <View className="tabs-icon">
        <View className={clsx("tabs-pill", focused && "tabs-active")}>
            <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={24}
                color={focused ? colors.selectedTab : colors.textSecondary}
            />
        </View>
    </View>
);

const TabLayout = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: Math.max(insets.bottom, tabBar.horizontalInset),
                    height: tabBar.height,
                    marginHorizontal: tabBar.horizontalInset,
                    borderRadius: tabBar.radius,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    elevation: 0,
                },
                tabBarItemStyle: {
                    paddingVertical: tabBar.height / 2 - tabBar.iconFrame / 1.6,
                },
                tabBarIconStyle: {
                    width: tabBar.iconFrame,
                    height: tabBar.iconFrame,
                    alignItems: "center",
                },
            }}
        >
            {TABS.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        title: tab.title,
                        tabBarIcon: ({ focused }) => <TabIcon focused={focused} tab={tab} />,
                    }}
                />
            ))}
        </Tabs>
    );
};

export default TabLayout;
