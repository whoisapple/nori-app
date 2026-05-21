import React from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { signInWithKakao as signInWithKakaoAuth } from "@/lib/auth/kakao";
import { signInWithGoogle as signInWithGoogleAuth } from "@/lib/auth/google";

const googleLogoSource = {
  uri: "https://developers.google.com/static/identity/images/g-logo.png",
};

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await signInWithGoogleAuth();
      router.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("Google 로그인에 실패했어요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithKakao = async () => {
    setLoading(true);
    setMessage(null);

    try {
      await signInWithKakaoAuth();
      router.replace("/");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage("카카오 로그인에 실패했어요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.frame}>
        <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.hero}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>N</Text>
              </View>
              <Text style={styles.title}>NORI 시작하기</Text>
              <Text style={styles.description}>Google 계정으로 로그인하고 중요한 이슈 흐름을 이어가세요.</Text>
            </View>

            <View style={styles.actions}>
              <Pressable accessibilityRole="button" disabled={loading} onPress={signInWithKakao} style={[styles.kakaoButton, loading && styles.primaryButtonDisabled]}>
                <Text style={styles.kakaoGlyph}>K</Text>
                <Text style={styles.kakaoButtonText}>{loading ? "처리 중" : "카카오로 계속하기"}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" disabled={loading} onPress={signInWithGoogle} style={[styles.oauthButton, loading && styles.primaryButtonDisabled]}>
                <View style={styles.googleLogoSlot}>
                  <Image source={googleLogoSource} style={styles.googleLogo} contentFit="contain" />
                </View>
                <Text style={styles.oauthButtonText}>{loading ? "처리 중" : "Google로 계속하기"}</Text>
              </Pressable>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </View>
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
  frame: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 56,
    backgroundColor: "#000000",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9ff",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  hero: {
    gap: 12,
    paddingTop: 44,
  },
  logoMark: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#191927",
  },
  logoText: {
    fontSize: 30,
    fontWeight: "800",
    color: "#f9f9ff",
  },
  title: {
    marginTop: 18,
    fontSize: 32,
    lineHeight: 41,
    fontWeight: "700",
    color: "#191927",
  },
  description: {
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "500",
    color: "#47475c",
  },
  message: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    color: "#f34026",
  },
  actions: {
    gap: 12,
  },
  kakaoButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    backgroundColor: "#fee500",
  },
  kakaoGlyph: {
    width: 46,
    paddingRight: 12,
    textAlign: "right",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    color: "#000000",
  },
  kakaoButtonText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#191600",
  },
  oauthButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#747775",
    borderRadius: 24,
    backgroundColor: "#ffffff",
  },
  googleLogoSlot: {
    width: 46,
    height: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 12,
  },
  googleLogo: {
    width: 18,
    height: 18,
  },
  oauthButtonText: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#1f1f1f",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
});
