import { Linking, Share } from "react-native";
import { shareFeedTemplate, shareTextTemplate } from "@react-native-kakao/share";
import RNShare, { Social } from "react-native-share";

export type ArticleShareTarget = "system" | "kakao" | "instagram" | "instagramStory";

export type ShareableArticle = {
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
};

const defaultShareUrl = "https://nori.app";
const instagramAppId = process.env.EXPO_PUBLIC_INSTAGRAM_APP_ID;

function getArticleShareUrl(article: ShareableArticle) {
  return article.url ?? defaultShareUrl;
}

function getArticleShareMessage(article: ShareableArticle) {
  const shareUrl = getArticleShareUrl(article);
  return [article.title, article.description, shareUrl].filter(Boolean).join("\n");
}

export async function shareArticle(article: ShareableArticle, target: ArticleShareTarget = "system"): Promise<void> {
  if (target === "kakao") {
    await shareArticleToKakaoTalk(article);
    return;
  }

  if (target === "instagram") {
    await shareArticleToInstagram(article);
    return;
  }

  if (target === "instagramStory") {
    await shareArticleToInstagramStory(article);
    return;
  }

  await shareArticleWithSystemSheet(article);
}

export async function shareArticleWithSystemSheet(article: ShareableArticle): Promise<void> {
  const shareUrl = getArticleShareUrl(article);

  try {
    const result = await Share.share({
      title: article.title,
      message: getArticleShareMessage(article),
      url: shareUrl,
    });

    if (result.action === Share.dismissedAction) {
      return;
    }
  } catch {
    await Linking.openURL(shareUrl);
  }
}

export async function shareArticleToKakaoTalk(article: ShareableArticle): Promise<void> {
  const shareUrl = getArticleShareUrl(article);
  const link = {
    webUrl: shareUrl,
    mobileWebUrl: shareUrl,
  };

  if (article.imageUrl) {
    await shareFeedTemplate({
      template: {
        content: {
          title: article.title,
          description: article.description,
          imageUrl: article.imageUrl,
          link,
        },
        buttons: [
          {
            title: "자세히 보기",
            link,
          },
        ],
      },
      useWebBrowserIfKakaoTalkNotAvailable: true,
    });
    return;
  }

  await shareTextTemplate({
    template: {
      text: getArticleShareMessage(article).slice(0, 200),
      link,
      buttons: [
        {
          title: "자세히 보기",
          link,
        },
      ],
    },
    useWebBrowserIfKakaoTalkNotAvailable: true,
  });
}

export async function shareArticleToInstagram(article: ShareableArticle): Promise<void> {
  await RNShare.shareSingle({
    social: Social.Instagram,
    title: article.title,
    message: getArticleShareMessage(article),
    url: getArticleShareUrl(article),
    forceDialog: true,
  });
}

export async function shareArticleToInstagramStory(article: ShareableArticle): Promise<void> {
  if (!instagramAppId) {
    throw new Error("Missing EXPO_PUBLIC_INSTAGRAM_APP_ID.");
  }

  await RNShare.shareSingle({
    social: Social.InstagramStories,
    appId: instagramAppId,
    backgroundImage: article.imageUrl,
    backgroundTopColor: "#f2f2fc",
    backgroundBottomColor: "#191927",
    linkUrl: getArticleShareUrl(article),
    linkText: "NORI에서 보기",
  });
}
