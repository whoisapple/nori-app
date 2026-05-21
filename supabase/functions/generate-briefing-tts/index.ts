// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const VOICE_A_ID = Deno.env.get("ELEVENLABS_VOICE_A_ID");
const VOICE_B_ID = Deno.env.get("ELEVENLABS_VOICE_B_ID");
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb";
const MODEL_ID = Deno.env.get("ELEVENLABS_DIALOGUE_MODEL_ID") ?? "eleven_v3";
const BUCKET = "briefing-audio";

const fallbackSegments = [
  {
    order_index: 0,
    speaker: "host_a",
    text: "좋은 아침이에요. 오늘 꼭 알아야 할 이슈부터 빠르게 볼까요?",
    start_time: 0,
    end_time: 4,
  },
  {
    order_index: 1,
    speaker: "host_b",
    text: "좋아요. 첫 번째는 미국 금리 이야기예요. 시장이 꽤 예민하게 보고 있죠.",
    start_time: 4,
    end_time: 9,
  },
  {
    order_index: 2,
    speaker: "host_a",
    text: "결론부터 말하면 당분간은 조심스러운 분위기가 이어질 가능성이 커요.",
    start_time: 9,
    end_time: 14,
  },
  {
    order_index: 3,
    speaker: "host_b",
    text: "그러면 투자자 입장에서는 속도보다 확인이 더 중요한 하루겠네요.",
    start_time: 14,
    end_time: 19,
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getLocalDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

async function getDialogueVoiceIds() {
  const hostA = VOICE_A_ID ?? DEFAULT_VOICE_ID;
  const hostB = VOICE_B_ID ?? VOICE_A_ID ?? DEFAULT_VOICE_ID;

  return { hostA, hostB };
}

function decodeBase64(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getSegmentTimings(segments, voiceSegments) {
  return segments.map((segment, index) => {
    const matchingVoiceSegments = voiceSegments.filter((voiceSegment) => voiceSegment.dialogue_input_index === index);

    if (matchingVoiceSegments.length === 0) {
      return {
        id: segment.id,
        start_time: Number(segment.start_time) || 0,
        end_time: Number(segment.end_time) || 0,
      };
    }

    return {
      id: segment.id,
      start_time: Math.min(...matchingVoiceSegments.map((voiceSegment) => Number(voiceSegment.start_time_seconds) || 0)),
      end_time: Math.max(...matchingVoiceSegments.map((voiceSegment) => Number(voiceSegment.end_time_seconds) || 0)),
    };
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!ELEVENLABS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing ELEVENLABS_API_KEY or Supabase service env" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const today = getLocalDateString();

  const { data: existingBriefing, error: briefingError } = await supabase
    .from("daily_briefings")
    .select("id,date,title,script,duration_seconds,briefing_segments(id,order_index,speaker,text,start_time,end_time)")
    .eq("date", today)
    .maybeSingle();

  if (briefingError) {
    return jsonResponse({ error: briefingError.message }, 500);
  }

  let briefing = existingBriefing;

  if (!briefing) {
    const script = fallbackSegments.map((segment) => `${segment.speaker === "host_b" ? "B" : "A"}: ${segment.text}`).join(" ");
    const { data: createdBriefing, error: createError } = await supabase
      .from("daily_briefings")
      .insert({
        date: today,
        title: "오늘의 5분 브리핑",
        script,
        duration_seconds: 19,
        status: "generating",
      })
      .select("id,date,title,script,duration_seconds")
      .single();

    if (createError) {
      return jsonResponse({ error: createError.message }, 500);
    }

    const { error: segmentError } = await supabase.from("briefing_segments").insert(
      fallbackSegments.map((segment) => ({
        briefing_id: createdBriefing.id,
        ...segment,
      })),
    );

    if (segmentError) {
      return jsonResponse({ error: segmentError.message }, 500);
    }

    briefing = { ...createdBriefing, briefing_segments: fallbackSegments };
  }

  const segments = [...(briefing.briefing_segments ?? [])].sort((a, b) => a.order_index - b.order_index);

  if (segments.length === 0) {
    return jsonResponse({ error: "No briefing segments to synthesize" }, 400);
  }

  await supabase.from("daily_briefings").update({ status: "generating" }).eq("id", briefing.id);

  let voiceIds;

  try {
    voiceIds = await getDialogueVoiceIds();
  } catch (error) {
    await supabase.from("daily_briefings").update({ status: "failed" }).eq("id", briefing.id);
    return jsonResponse({ error: error instanceof Error ? error.message : "ElevenLabs voice를 가져오지 못했어요." }, 502);
  }

  const dialogue = segments.map((segment) => ({
    text: segment.text,
    voice_id: segment.speaker === "host_b" ? voiceIds.hostB : voiceIds.hostA,
  }));

  const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: dialogue,
      model_id: MODEL_ID,
      language_code: "ko",
    }),
  });

  if (!elevenResponse.ok) {
    const detail = await elevenResponse.text();
    await supabase.from("daily_briefings").update({ status: "failed" }).eq("id", briefing.id);
    return jsonResponse({ error: "ElevenLabs TTS failed", detail }, 502);
  }

  const elevenData = await elevenResponse.json();
  const audio = decodeBase64(elevenData.audio_base64);
  const segmentTimings = getSegmentTimings(segments, elevenData.voice_segments ?? []);
  const durationSeconds = Math.ceil(Math.max(...segmentTimings.map((segment) => Number(segment.end_time) || 0)));

  const objectPath = `${briefing.id}/${Date.now()}.mp3`;
  await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 52428800,
    allowedMimeTypes: ["audio/mpeg", "audio/mp3"],
  });

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, audio, {
    contentType: "audio/mpeg",
    upsert: true,
  });

  if (uploadError) {
    await supabase.from("daily_briefings").update({ status: "failed" }).eq("id", briefing.id);
    return jsonResponse({ error: uploadError.message }, 500);
  }

  const timingUpdates = segmentTimings
    .filter((segment) => segment.id)
    .map((segment) =>
      supabase
        .from("briefing_segments")
        .update({
          start_time: segment.start_time,
          end_time: segment.end_time,
        })
        .eq("id", segment.id),
    );

  const timingResults = await Promise.all(timingUpdates);
  const timingError = timingResults.find((result) => result.error)?.error;

  if (timingError) {
    await supabase.from("daily_briefings").update({ status: "failed" }).eq("id", briefing.id);
    return jsonResponse({ error: timingError.message }, 500);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const audioUrl = publicUrlData.publicUrl;

  const { error: updateError } = await supabase
    .from("daily_briefings")
    .update({
      audio_url: audioUrl,
      duration_seconds: durationSeconds,
      status: "published",
    })
    .eq("id", briefing.id);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({ ok: true, briefingId: briefing.id, audioUrl, segmentTimings });
});
