alter table public.briefing_segments
add column if not exists speaker text not null default 'host_a'
check (speaker in ('host_a', 'host_b'));

create index if not exists briefing_segments_briefing_id_speaker_idx on public.briefing_segments(briefing_id, speaker);
