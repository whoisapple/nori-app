import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables.");
}

const serverStorage = new Map<string, string>();

const supabaseStorage = {
  async getItem(key: string) {
    if (typeof window === "undefined") {
      return serverStorage.get(key) ?? null;
    }

    if (typeof window.localStorage !== "undefined") {
      return window.localStorage.getItem(key);
    }

    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (typeof window === "undefined") {
      serverStorage.set(key, value);
      return;
    }

    if (typeof window.localStorage !== "undefined") {
      window.localStorage.setItem(key, value);
      return;
    }

    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string) {
    if (typeof window === "undefined") {
      serverStorage.delete(key);
      return;
    }

    if (typeof window.localStorage !== "undefined") {
      window.localStorage.removeItem(key);
      return;
    }

    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
