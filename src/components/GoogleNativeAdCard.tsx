import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { getGoogleMobileAdsModule, loadNativeAd, type NativeAdLike } from "@/lib/ads";

type NativeAdCardVariant = "deck" | "list";

type GoogleNativeAdCardProps = {
  variant?: NativeAdCardVariant;
  placeholderOnly?: boolean;
};

export function GoogleNativeAdCard({ variant = "list", placeholderOnly = false }: GoogleNativeAdCardProps) {
  const [nativeAd, setNativeAd] = React.useState<NativeAdLike | null>(null);
  const [hasFailed, setHasFailed] = React.useState(false);

  React.useEffect(() => {
    if (placeholderOnly) {
      return;
    }

    let mounted = true;
    let ad: NativeAdLike | null = null;

    loadNativeAd()
      .then((loadedAd) => {
        if (!mounted) {
          loadedAd?.destroy();
          return;
        }

        ad = loadedAd;
        setNativeAd(loadedAd);
      })
      .catch((error) => {
        console.warn("Native ad failed to load.", error);
        if (mounted) {
          setHasFailed(true);
        }
      });

    return () => {
      mounted = false;
      ad?.destroy();
    };
  }, [placeholderOnly]);

  if (hasFailed) {
    return null;
  }

  if (placeholderOnly || !nativeAd) {
    return <NativeAdPlaceholder variant={variant} />;
  }

  const module = getGoogleMobileAdsModule();

  if (!module) {
    return null;
  }

  const { NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } = module;
  const showMedia = Boolean(nativeAd.mediaContent);

  if (variant === "list") {
    return (
      <NativeAdView nativeAd={nativeAd} style={styles.listCard}>
        <View style={styles.listContent}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text style={styles.listHeadline} numberOfLines={2}>
              {nativeAd.headline}
            </Text>
          </NativeAsset>

          {nativeAd.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text style={styles.listBody} numberOfLines={1}>
                {nativeAd.body}
              </Text>
            </NativeAsset>
          ) : null}

          <View style={styles.listMetaRow}>
            <Text style={styles.adBadge}>광고</Text>
            {nativeAd.advertiser ? (
              <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                <Text style={styles.listAdvertiser} numberOfLines={1}>
                  {nativeAd.advertiser}
                </Text>
              </NativeAsset>
            ) : null}
            {nativeAd.callToAction ? (
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Text style={styles.listCta} numberOfLines={1}>
                  {nativeAd.callToAction}
                </Text>
              </NativeAsset>
            ) : null}
          </View>
        </View>

        {showMedia ? (
          <NativeMediaView resizeMode="cover" style={styles.listMedia} />
        ) : nativeAd.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: nativeAd.icon.url }} style={styles.listMedia} contentFit="cover" />
          </NativeAsset>
        ) : (
          <View style={styles.mediaFallback} />
        )}
      </NativeAdView>
    );
  }

  return (
    <NativeAdView nativeAd={nativeAd} style={styles.deckCard}>
      {showMedia ? (
        <NativeMediaView resizeMode="cover" style={styles.deckMedia} />
      ) : nativeAd.icon?.url ? (
        <NativeAsset assetType={NativeAssetType.ICON}>
          <Image source={{ uri: nativeAd.icon.url }} style={styles.deckMedia} contentFit="cover" />
        </NativeAsset>
      ) : (
        <View style={styles.deckMediaFallback} />
      )}

      <View style={styles.deckContent}>
        <View style={styles.listMetaRow}>
          <Text style={styles.adBadge}>광고</Text>
          {nativeAd.advertiser ? (
            <NativeAsset assetType={NativeAssetType.ADVERTISER}>
              <Text style={styles.deckAdvertiser} numberOfLines={1}>
                {nativeAd.advertiser}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
        <NativeAsset assetType={NativeAssetType.HEADLINE}>
          <Text style={styles.deckHeadline} numberOfLines={2}>
            {nativeAd.headline}
          </Text>
        </NativeAsset>
        {nativeAd.body ? (
          <NativeAsset assetType={NativeAssetType.BODY}>
            <Text style={styles.deckBody} numberOfLines={2}>
              {nativeAd.body}
            </Text>
          </NativeAsset>
        ) : null}
      </View>
      {nativeAd.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text style={styles.deckCta} numberOfLines={1}>
            {nativeAd.callToAction}
          </Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

function NativeAdPlaceholder({ variant }: { variant: NativeAdCardVariant }) {
  if (variant === "list") {
    return (
      <View style={styles.listCard}>
        <View style={styles.listContent}>
          <View style={styles.placeholderTitle} />
          <View style={styles.placeholderLine} />
          <View style={styles.placeholderMetaRow}>
            <View style={styles.placeholderBadge} />
            <View style={styles.placeholderMeta} />
          </View>
        </View>
        <View style={styles.mediaFallback} />
      </View>
    );
  }

  return (
    <View style={styles.deckCard}>
      <View style={styles.deckMediaFallback} />
      <View style={styles.placeholderMetaRow}>
        <View style={styles.placeholderBadge} />
        <View style={styles.placeholderMeta} />
      </View>
      <View style={styles.placeholderDeckTitle} />
      <View style={styles.placeholderDeckLine} />
      <View style={styles.placeholderButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  deckCard: {
    width: "100%",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeefa",
  },
  listCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#eeeefa",
  },
  listContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
  },
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  adBadge: {
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: "#303041",
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  listHeadline: {
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 27,
    color: "#303041",
    marginBottom: 4,
  },
  listBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#69697c",
    marginBottom: 8,
  },
  listAdvertiser: {
    maxWidth: 96,
    fontSize: 13,
    color: "#69697c",
  },
  listMedia: {
    width: 88,
    height: 88,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eeeefa",
    backgroundColor: "#eeeefa",
  },
  mediaFallback: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eeeefa",
    backgroundColor: "#eeeefa",
  },
  listCta: {
    fontSize: 13,
    fontWeight: "700",
    color: "#303041",
  },
  deckMedia: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#eeeefa",
  },
  deckMediaFallback: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: "#eeeefa",
  },
  deckContent: {
    gap: 8,
    paddingTop: 12,
  },
  deckAdvertiser: {
    maxWidth: 220,
    fontSize: 13,
    color: "#69697c",
  },
  deckHeadline: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
    color: "#303041",
  },
  deckBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#69697c",
  },
  deckCta: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#303041",
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: "hidden",
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  placeholderTitle: {
    width: "92%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#eeeefa",
  },
  placeholderLine: {
    width: "72%",
    height: 14,
    marginTop: 8,
    borderRadius: 7,
    backgroundColor: "#eeeefa",
  },
  placeholderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  placeholderBadge: {
    width: 28,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#eeeefa",
  },
  placeholderMeta: {
    width: 88,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#eeeefa",
  },
  placeholderDeckTitle: {
    width: "88%",
    height: 24,
    marginTop: 12,
    borderRadius: 6,
    backgroundColor: "#eeeefa",
  },
  placeholderDeckLine: {
    width: "70%",
    height: 15,
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#eeeefa",
  },
  placeholderButton: {
    width: 92,
    height: 34,
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#eeeefa",
  },
});
