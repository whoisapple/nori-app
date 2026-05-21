import { supabase } from "@/lib/supabase";

export type BriefingSegment = {
  id: string;
  order_index: number;
  speaker: "host_a" | "host_b";
  text: string;
  start_time: number;
  end_time: number;
};

export type DailyBriefing = {
  id: string;
  date: string;
  title: string;
  script: string;
  audio_url: string | null;
  duration_seconds: number | null;
  segments: BriefingSegment[];
  isMock?: boolean;
};

type BriefingSegmentRow = {
  id: string;
  order_index: number;
  speaker?: "host_a" | "host_b" | null;
  text: string;
  start_time: number | string;
  end_time: number | string;
};

type DailyBriefingRow = {
  id: string;
  date: string;
  title: string;
  script: string;
  audio_url: string | null;
  duration_seconds: number | null;
  briefing_segments?: BriefingSegmentRow[];
};

const MOCK_SEGMENTS: BriefingSegment[] = [
  {
    id: "mock-segment-1",
    order_index: 0,
    speaker: "host_a",
    text: "좋은 아침이에요. 오늘 꼭 알아야 할 이슈부터 빠르게 볼까요?",
    start_time: 0,
    end_time: 4,
  },
  {
    id: "mock-segment-2",
    order_index: 1,
    speaker: "host_b",
    text: "좋아요. 첫 번째는 미국 금리 이야기예요. 시장이 꽤 예민하게 보고 있죠.",
    start_time: 4,
    end_time: 9,
  },
  {
    id: "mock-segment-3",
    order_index: 2,
    speaker: "host_a",
    text: "결론부터 말하면 당분간은 조심스러운 분위기가 이어질 가능성이 커요.",
    start_time: 9,
    end_time: 14,
  },
  {
    id: "mock-segment-4",
    order_index: 3,
    speaker: "host_b",
    text: "그러면 투자자 입장에서는 속도보다 확인이 더 중요한 하루겠네요.",
    start_time: 14,
    end_time: 19,
  },
];

export const MOCK_TODAY_BRIEFING: DailyBriefing = {
  id: "mock-today-briefing",
  date: getLocalDateString(),
  title: "오늘의 5분 브리핑",
  script: MOCK_SEGMENTS.map((segment) => segment.text).join(" "),
  audio_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  duration_seconds: 19,
  segments: MOCK_SEGMENTS,
  isMock: true,
};

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function shouldUseMockBriefing() {
  return process.env.EXPO_PUBLIC_USE_MOCK_BRIEFING === "true" || (__DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_BRIEFING !== "false");
}

function mapSegment(row: BriefingSegmentRow): BriefingSegment {
  return {
    id: row.id,
    order_index: row.order_index,
    speaker: row.speaker ?? "host_a",
    text: row.text,
    start_time: Number(row.start_time),
    end_time: Number(row.end_time),
  };
}

function mapBriefing(row: DailyBriefingRow): DailyBriefing {
  const segments = row.briefing_segments?.map(mapSegment).sort((a, b) => a.order_index - b.order_index) ?? [];

  return {
    id: row.id,
    date: row.date,
    title: row.title,
    script: row.script,
    audio_url: row.audio_url,
    duration_seconds: row.duration_seconds,
    segments,
  };
}

export async function getTodayBriefing(): Promise<DailyBriefing | null> {
  const today = getLocalDateString();

  const { data, error } = await supabase
    .from("daily_briefings")
    .select("id,date,title,script,audio_url,duration_seconds,briefing_segments(id,order_index,speaker,text,start_time,end_time)")
    .eq("date", today)
    .eq("status", "published")
    .order("order_index", { referencedTable: "briefing_segments", ascending: true })
    .maybeSingle();

  if (error) {
    if (shouldUseMockBriefing()) {
      console.warn("Falling back to mock briefing.", error);
      return MOCK_TODAY_BRIEFING;
    }

    throw error;
  }

  if (!data) {
    return shouldUseMockBriefing() ? MOCK_TODAY_BRIEFING : null;
  }

  return mapBriefing(data as DailyBriefingRow);
}

export async function generateTodayBriefingAudio(): Promise<{ audioUrl: string }> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("로그인 상태를 확인하지 못했어요.");
  }

  if (!session?.access_token) {
    throw new Error("로그인 후 TTS를 생성할 수 있어요.");
  }

  const { data, error } = await supabase.functions.invoke<{ audioUrl: string }>("generate-briefing-tts", {
    body: {},
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    const context = "context" in error ? error.context : null;

    if (context instanceof Response) {
      try {
        const body = (await context.json()) as { error?: string; detail?: string };
        throw new Error([body.error, body.detail].filter(Boolean).join(": ") || error.message);
      } catch (parseError) {
        if (parseError instanceof Error && parseError.message !== error.message) {
          throw parseError;
        }
      }
    }

    throw new Error(error.message);
  }

  if (!data?.audioUrl) {
    throw new Error("TTS 오디오 URL을 받지 못했어요.");
  }

  return { audioUrl: data.audioUrl };
}
