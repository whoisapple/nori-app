// @ts-nocheck

const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_REPORT_WEBHOOK_URL");

const reasonLabels: Record<string, string> = {
  misleading: "부정확하거나 오해 소지가 있어요",
  inappropriate: "부적절한 내용이에요",
  duplicate: "중복된 이슈예요",
  broken: "기사 링크/내용이 이상해요",
  other: "기타",
};

type ReportDiscordPayload = {
  issueId?: string;
  title?: string;
  reason?: string;
  note?: string | null;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!DISCORD_WEBHOOK_URL) {
    return jsonResponse({ error: "Missing DISCORD_REPORT_WEBHOOK_URL" }, 500);
  }

  let payload: ReportDiscordPayload;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  if (!payload.issueId || !payload.reason) {
    return jsonResponse({ error: "Missing report payload" }, 400);
  }

  const reasonLabel = reasonLabels[payload.reason] ?? payload.reason;
  const title = payload.title?.trim() || "제목 없음";
  const articleUrl = `https://nori.app/article/${payload.issueId}`;

  const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "NORI 신고 알림",
      embeds: [
        {
          title: "새 신고가 들어왔어요",
          description: title,
          color: 15941670,
          fields: [
            { name: "사유", value: reasonLabel, inline: false },
            { name: "이슈 ID", value: payload.issueId, inline: false },
            { name: "링크", value: articleUrl, inline: false },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!discordResponse.ok) {
    return jsonResponse({ error: "Discord webhook failed" }, 502);
  }

  return jsonResponse({ ok: true });
});
