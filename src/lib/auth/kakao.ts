import { getProfile, login, loginWithKakaoAccount, type KakaoOAuthToken, type KakaoProfile } from "@react-native-seoul/kakao-login";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export type KakaoAuthResult = {
  user: User;
  session: Session;
  kakaoToken: KakaoOAuthToken;
  kakaoProfile: KakaoProfile | null;
  idToken: string;
  accessToken: string;
};

export class KakaoAuthError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "KakaoAuthError";
  }
}

async function getKakaoProfileSafely() {
  try {
    return await getProfile();
  } catch {
    return null;
  }
}

export async function signInWithKakao(): Promise<KakaoAuthResult> {
  try {
    const kakaoToken = await login();
    return await signInToSupabaseWithKakaoToken(kakaoToken);
  } catch (error) {
    throw normalizeKakaoAuthError(error);
  }
}

export async function signInWithKakaoAccount(): Promise<KakaoAuthResult> {
  try {
    const kakaoToken = await loginWithKakaoAccount();
    return await signInToSupabaseWithKakaoToken(kakaoToken);
  } catch (error) {
    throw normalizeKakaoAuthError(error);
  }
}

async function signInToSupabaseWithKakaoToken(kakaoToken: KakaoOAuthToken): Promise<KakaoAuthResult> {
  const idToken = kakaoToken.idToken;
  const accessToken = kakaoToken.accessToken;

  if (!idToken) {
    throw new KakaoAuthError("Kakao did not return an ID token. Enable OpenID Connect and request the openid scope in Kakao Developers.", "missing_id_token");
  }

  if (!accessToken) {
    throw new KakaoAuthError("Kakao did not return an access token.", "missing_access_token");
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "kakao",
    token: idToken,
    access_token: accessToken,
  });

  if (error) {
    throw new KakaoAuthError(error.message, "supabase_sign_in_failed", error);
  }

  if (!data.user || !data.session) {
    throw new KakaoAuthError("Supabase did not return a user session.", "missing_supabase_session");
  }

  return {
    user: data.user,
    session: data.session,
    kakaoToken,
    kakaoProfile: await getKakaoProfileSafely(),
    idToken,
    accessToken,
  };
}

function normalizeKakaoAuthError(error: unknown) {
  if (error instanceof KakaoAuthError) {
    return error;
  }

  if (error instanceof Error) {
    return new KakaoAuthError(error.message, "kakao_sign_in_failed", error);
  }

  return new KakaoAuthError("Kakao sign-in failed.", "unknown", error);
}
