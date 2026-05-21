import React from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";

import { REPORT_REASONS, type ReportReason, submitIssueReport } from "@/lib/reports";

export type ReportSheetTarget = {
  issueId: string;
  title: string;
};

type ReportSheetProps = {
  visible: boolean;
  target: ReportSheetTarget | null;
  onClose: () => void;
};

export function ReportSheet({ visible, target, onClose }: ReportSheetProps) {
  const presentingRef = React.useRef(false);

  React.useEffect(() => {
    if (!visible || !target || presentingRef.current) return;

    presentingRef.current = true;

    const close = () => {
      presentingRef.current = false;
      onClose();
    };

    const submit = async (reason: ReportReason) => {
      try {
        await submitIssueReport({ issueId: target.issueId, title: target.title, reason });
        Alert.alert("신고 완료", "검토할게요.");
      } catch (error) {
        Alert.alert("신고 실패", error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.");
      } finally {
        close();
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "신고 사유",
          message: target.title,
          options: [...REPORT_REASONS.map((reason) => reason.label), "취소"],
          cancelButtonIndex: REPORT_REASONS.length,
          userInterfaceStyle: "light",
        },
        (selectedIndex) => {
          const selectedReason = REPORT_REASONS[selectedIndex];

          if (!selectedReason) {
            close();
            return;
          }

          void submit(selectedReason.value);
        },
      );
      return;
    }

    Alert.alert(
      "신고 사유",
      target.title,
      [
        ...REPORT_REASONS.map((reason) => ({
          text: reason.label,
          onPress: () => void submit(reason.value),
        })),
        { text: "취소", style: "cancel" as const, onPress: close },
      ],
      { cancelable: true, onDismiss: close },
    );
  }, [onClose, target, visible]);

  return null;
}
