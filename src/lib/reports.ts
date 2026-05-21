import { supabase } from "@/lib/supabase";

export const REPORT_REASONS = [
  { value: "misleading", label: "부정확하거나 오해 소지가 있어요" },
  { value: "inappropriate", label: "부적절한 내용이에요" },
  { value: "duplicate", label: "중복된 이슈예요" },
  { value: "broken", label: "기사 링크/내용이 이상해요" },
  { value: "other", label: "기타" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["value"];

type SubmitIssueReportInput = {
  issueId: string;
  title: string;
  reason: ReportReason;
  note?: string;
};

export class ReportSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReportSubmissionError";
  }
}

export async function submitIssueReport({ issueId, title, reason, note }: SubmitIssueReportInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new ReportSubmissionError("로그인 상태를 확인하지 못했어요.");
  }

  if (!user) {
    throw new ReportSubmissionError("로그인 후 신고할 수 있어요.");
  }

  const { error } = await supabase.from("issue_reports").insert({
    issue_id: issueId,
    user_id: user.id,
    reason,
    note: note?.trim() || null,
  });

  if (error) {
    throw new ReportSubmissionError("신고를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const { error: webhookError } = await supabase.functions.invoke("report-discord", {
    body: { issueId, title, reason, note: note?.trim() || null },
  });

  if (webhookError) {
    console.warn("Failed to send report notification to Discord.", webhookError);
  }
}
