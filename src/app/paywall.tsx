import { msCheckCircle } from "@material-symbols-react-native/outlined-300/msCheckCircle";
import { msClose } from "@material-symbols-react-native/outlined-300/msClose";
import { msWorkspacePremium } from "@material-symbols-react-native/outlined-300/msWorkspacePremium";
import { useRouter } from "expo-router";
import { MsIcon } from "material-symbols-react-native";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthSession } from "@/hooks/use-auth-session";
import { useSubscription } from "@/hooks/use-subscription";

const benefits = ["오디오 브리핑 전체 청취", "광고 제거", "실시간 텍스트 하이라이트", "프리미엄 요약 기능 우선 제공"];

const mockPackages = [
  {
    id: "mock_monthly",
    title: "PRO",
    description: "매달 결제, 언제든 해지 가능",
    price: "월 3,900",
  },
  {
    id: "mock_yearly",
    title: "PRO",
    description: "연간 결제로 더 저렴하게",
    price: "연 39,000",
  },
  {
    id: "mock_lifetime",
    title: "Early Supporter",
    description: "평생 PRO · 초기 한정",
    price: "59,000",
  },
];

type PreviewPackage = {
  id: string;
  title: string;
  description: string;
  price: string;
  package?: PurchasesPackage;
};

export default function PaywallScreen() {
  const router = useRouter();
  const { session } = useAuthSession();
  const { packages, isConfigured, isPro, loading, busy, error, purchase, restore } = useSubscription({ userId: session?.user.id });

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <View />
            <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={() => router.back()} style={styles.closeButton}>
              <MsIcon icon={msClose} size={24} color="#717181" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.heroIcon}>
              <MsIcon icon={msWorkspacePremium} size={34} color="#f9f9ff" />
            </View>
            <Text style={styles.title}>NORI Pro</Text>
            <Text style={styles.description}>뉴스를 듣고, 따라 읽고, 더 빠르게 정리하는 프리미엄 경험을 열어요.</Text>

            <View style={styles.benefits}>
              {benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <MsIcon icon={msCheckCircle} size={20} color="#3f6ef1" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>

            {isPro ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>이미 Pro를 사용 중이에요</Text>
              </View>
            ) : loading ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>상품을 불러오는 중</Text>
              </View>
            ) : (
              <View style={styles.packageList}>
                {(packages.length > 0
                  ? packages.map((item) => ({
                      id: item.identifier,
                      title: item.product.title,
                      description: item.product.description || item.identifier,
                      price: item.product.priceString,
                      package: item,
                    }))
                  : mockPackages
                ).map((item: PreviewPackage) => (
                  <Pressable
                    key={item.id}
                    disabled={busy}
                    onPress={() => {
                      if (item.package) {
                        void purchase(item.package);
                      }
                    }}
                    style={styles.packageButton}
                  >
                    <View style={styles.packageText}>
                      <Text style={styles.packageTitle}>{item.title}</Text>
                      <Text style={styles.packageDescription}>{item.description}</Text>
                    </View>
                    <Text style={styles.packagePrice}>{item.price}</Text>
                  </Pressable>
                ))}
                {!isConfigured || packages.length === 0 ? <Text style={styles.mockNotice}>지금은 UI 미리보기예요. 실제 결제는 스토어 상품 연결 후 활성화돼요.</Text> : null}
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void restore()} style={styles.restoreButton}>
              <Text style={styles.restoreText}>{busy ? "처리 중" : "구매 복원"}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f2f2fc",
  },
  container: {
    flex: 1,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: "#f2f2fc",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#ffffff",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: "center",
  },
  heroIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#191927",
  },
  title: {
    marginTop: 20,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "900",
    color: "#191927",
  },
  description: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "600",
    textAlign: "center",
    color: "#47475c",
  },
  benefits: {
    width: "100%",
    gap: 12,
    marginTop: 28,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#ffffff",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    color: "#303041",
  },
  stateBox: {
    width: "100%",
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#303041",
    textAlign: "center",
  },
  stateDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#717181",
    textAlign: "center",
  },
  packageList: {
    width: "100%",
    gap: 10,
    marginTop: 20,
  },
  packageButton: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#191927",
  },
  packageText: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f9f9ff",
  },
  packageDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#babacc",
  },
  packagePrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#f9f9ff",
  },
  mockNotice: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#717181",
  },
  errorText: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    color: "#f34026",
  },
  restoreButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#717181",
  },
});
