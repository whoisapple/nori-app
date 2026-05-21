import { Platform } from "react-native";

declare const require: (moduleName: string) => GoogleMobileAdsModule;

export const TEST_ADMOB_ANDROID_APP_ID = "ca-app-pub-3940256099942544~3347511713";
export const TEST_ADMOB_IOS_APP_ID = "ca-app-pub-3940256099942544~1458002511";

export type NativeAdImage = {
  url: string;
  width?: number;
  height?: number;
};

export type NativeAdLike = {
  destroy: () => void;
  headline: string;
  body: string;
  callToAction: string;
  advertiser: string | null;
  icon: NativeAdImage | null;
  mediaContent: { aspectRatio?: number } | null;
};

type GoogleMobileAdsModule = {
  AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
  default: () => {
    initialize: () => Promise<unknown>;
  };
  NativeAd: {
    createForAdRequest: (adUnitId: string, requestOptions?: Record<string, unknown>) => Promise<NativeAdLike>;
  };
  NativeAdView: React.ComponentType<any>;
  NativeAsset: React.ComponentType<any>;
  NativeAssetType: Record<string, string>;
  NativeMediaView: React.ComponentType<any>;
  RewardedAd: {
    createForAdRequest: (adUnitId: string, requestOptions?: Record<string, unknown>) => RewardedAdLike;
  };
  RewardedAdEventType: {
    EARNED_REWARD: string;
    LOADED: string;
  };
  TestIds: {
    NATIVE: string;
    REWARDED: string;
  };
};

type RewardedAdLike = {
  addAdEventListener: (type: string, listener: (payload?: unknown) => void) => () => void;
  load: () => void;
  show: () => Promise<void>;
};

let cachedModule: GoogleMobileAdsModule | null | undefined;

export function getGoogleMobileAdsModule() {
  if (Platform.OS === "web") {
    return null;
  }

  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = require("react-native-google-mobile-ads");
  } catch (error) {
    console.warn("Google Mobile Ads native module is not available in this build.", error);
    cachedModule = null;
  }

  return cachedModule;
}

export function getNativeAdUnitId() {
  const module = getGoogleMobileAdsModule();
  const envAdUnitId = Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_NATIVE_IOS_AD_UNIT_ID,
    android: process.env.EXPO_PUBLIC_ADMOB_NATIVE_ANDROID_AD_UNIT_ID,
    default: undefined,
  });

  return envAdUnitId || module?.TestIds.NATIVE || "";
}

export function getRewardedAdUnitId() {
  const module = getGoogleMobileAdsModule();
  const envAdUnitId = Platform.select({
    ios: process.env.EXPO_PUBLIC_ADMOB_REWARDED_IOS_AD_UNIT_ID,
    android: process.env.EXPO_PUBLIC_ADMOB_REWARDED_ANDROID_AD_UNIT_ID,
    default: undefined,
  });

  return envAdUnitId || module?.TestIds.REWARDED || "";
}

export async function initializeGoogleMobileAds() {
  const module = getGoogleMobileAdsModule();

  if (!module) {
    return false;
  }

  try {
    await module.default().initialize();
    return true;
  } catch (error) {
    console.warn("Google Mobile Ads initialization failed.", error);
    return false;
  }
}

export async function loadNativeAd() {
  const module = getGoogleMobileAdsModule();
  const adUnitId = getNativeAdUnitId();

  if (!module || !adUnitId) {
    return null;
  }

  return module.NativeAd.createForAdRequest(adUnitId, {
    requestAgent: "nori-native-feed",
  });
}

export async function showRewardedAdForBriefingUnlock() {
  const module = getGoogleMobileAdsModule();
  const adUnitId = getRewardedAdUnitId();

  if (!module || !adUnitId) {
    return false;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    let earnedReward = false;
    const rewardedAd = module.RewardedAd.createForAdRequest(adUnitId, {
      requestAgent: "nori-briefing-unlock",
    });
    const unsubscribers: (() => void)[] = [];

    const finish = (unlocked: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(unlocked);
    };

    unsubscribers.push(
      rewardedAd.addAdEventListener(module.RewardedAdEventType.LOADED, () => {
        rewardedAd.show().catch((error) => {
          console.warn("Rewarded ad show failed.", error);
          finish(false);
        });
      }),
    );
    unsubscribers.push(
      rewardedAd.addAdEventListener(module.RewardedAdEventType.EARNED_REWARD, () => {
        earnedReward = true;
      }),
    );
    unsubscribers.push(
      rewardedAd.addAdEventListener(module.AdEventType.CLOSED, () => {
        finish(earnedReward);
      }),
    );
    unsubscribers.push(
      rewardedAd.addAdEventListener(module.AdEventType.ERROR, (error) => {
        console.warn("Rewarded ad failed.", error);
        finish(false);
      }),
    );

    rewardedAd.load();
  });
}
