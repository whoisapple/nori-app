import { View, Text, Pressable } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import type { MsIconDefinition } from "material-symbols-react-native";
import { msStar } from "@material-symbols-react-native/outlined-300/msStar";
import { msStarFill } from "@material-symbols-react-native/outlined-300/msStarFill";
import { msFeed } from "@material-symbols-react-native/outlined-300/msFeed";
import { msFeedFill } from "@material-symbols-react-native/outlined-300/msFeedFill";
import { msPerson } from "@material-symbols-react-native/outlined-300/msPerson";
import { msPersonFill } from "@material-symbols-react-native/outlined-300/msPersonFill";
import { SafeAreaView } from "react-native-safe-area-context";

type TabKey = "recommend" | "category" | "profile";

type TabItem = {
  key: TabKey;
  icon: MsIconDefinition;
  activeIcon: MsIconDefinition;
  label: string;
  route: string;
};

const bottomTabs: TabItem[] = [
  { key: "recommend", icon: msStar, activeIcon: msStarFill, label: "추천", route: "/" },
  { key: "category", icon: msFeed, activeIcon: msFeedFill, label: "카테고리", route: "/category" },
  { key: "profile", icon: msPerson, activeIcon: msPersonFill, label: "프로필", route: "/profile" },
];

export function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const activeTab: TabKey = pathname === "/category" ? "category" : pathname === "/profile" ? "profile" : "recommend";

  const handleTabPress = (route: string) => {
    if (pathname === route) return;

    router.replace(route as any);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={{ width: "100%", backgroundColor: "#000000" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 }}>
        {bottomTabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${tab.label} 탭`}
              onPress={() => handleTabPress(tab.route)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 }}
            >
              <MsIcon icon={active ? tab.activeIcon : tab.icon} size={24} color={active ? "#f9f9ff" : "#69697c"} />
              <Text style={{ fontSize: 12, fontWeight: "500", marginTop: 4, color: active ? "#f9f9ff" : "#69697c" }}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export type { TabKey };
