import React from "react";
import { Alert } from "react-native";

import { shareArticle, type ShareableArticle } from "@/lib/share";

type ShareSheetProps = {
  article: ShareableArticle | null;
  visible: boolean;
  onClose: () => void;
};

export function ShareSheet({ article, visible, onClose }: ShareSheetProps) {
  const isPresentingRef = React.useRef(false);

  React.useEffect(() => {
    if (!visible || !article || isPresentingRef.current) return;

    isPresentingRef.current = true;

    void shareArticle(article, "system")
      .catch((error) => {
        const message = error instanceof Error ? error.message : "공유를 실행하지 못했어요.";
        Alert.alert("공유 실패", message);
      })
      .finally(() => {
          isPresentingRef.current = false;
          onClose();
      });
  }, [article, onClose, visible]);

  return null;
}
