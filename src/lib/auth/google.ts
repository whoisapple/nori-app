import { Platform } from "react-native";
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
  type User as GoogleUser,
} from "@react-native-google-signin/google-signin";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let isConfigured = false;

export type GoogleAuthResult = {
  user: User;
  session: Session;
  googleUser: GoogleUser;
  idToken: string;
  accessToken: string;
};

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

export function configureGoogleSignIn() {
  if (isConfigured) return;

  if (!googleWebClientId) {
    throw new GoogleAuthError("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.", "missing_web_client_id");
  }

  if (Platform.OS === "ios" && !googleIosClientId) {
    throw new GoogleAuthError("Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.", "missing_ios_client_id");
  }

  GoogleSignin.configure({
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    offlineAccess: false,
  });

  isConfigured = true;
}

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    configureGoogleSignIn();

    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const googleResponse = await GoogleSignin.signIn();
    if (isCancelledResponse(googleResponse)) {
      throw new GoogleAuthError("Google sign-in was cancelled.", "cancelled");
    }

    const googleUser = googleResponse.data;
    const tokens = await GoogleSignin.getTokens();
    const idToken = googleUser.idToken ?? tokens.idToken;
    const accessToken = tokens.accessToken;

    if (!idToken) {
      throw new GoogleAuthError("Google did not return an ID token.", "missing_id_token");
    }

    if (!accessToken) {
      throw new GoogleAuthError("Google did not return an access token.", "missing_access_token");
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
      access_token: accessToken,
    });

    if (error) {
      throw new GoogleAuthError(error.message, "supabase_sign_in_failed", error);
    }

    if (!data.user || !data.session) {
      throw new GoogleAuthError("Supabase did not return a user session.", "missing_supabase_session");
    }

    return {
      user: data.user,
      session: data.session,
      googleUser,
      idToken,
      accessToken,
    };
  } catch (error) {
    if (error instanceof GoogleAuthError) {
      throw error;
    }

    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new GoogleAuthError("Google sign-in was cancelled.", "cancelled", error);
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        throw new GoogleAuthError("Google sign-in is already in progress.", "in_progress", error);
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new GoogleAuthError("Google Play Services is not available or needs an update.", "play_services_not_available", error);
      }

      throw new GoogleAuthError(error.message, error.code, error);
    }

    throw new GoogleAuthError("Google sign-in failed.", "unknown", error);
  }
}
