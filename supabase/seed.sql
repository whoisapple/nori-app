insert into public.daily_briefings (date, title, script, audio_url, duration_seconds, status)
values (
  current_date,
  '오늘의 5분 브리핑',
  'A: 좋은 아침이에요. 오늘 꼭 알아야 할 이슈부터 빠르게 볼까요? B: 좋아요. 첫 번째는 미국 금리 이야기예요. 시장이 꽤 예민하게 보고 있죠. A: 결론부터 말하면 당분간은 조심스러운 분위기가 이어질 가능성이 커요. B: 그러면 투자자 입장에서는 속도보다 확인이 더 중요한 하루겠네요.',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  19,
  'published'
)
on conflict (date) do update
set
  title = excluded.title,
  script = excluded.script,
  audio_url = excluded.audio_url,
  duration_seconds = excluded.duration_seconds,
  status = excluded.status;

with briefing as (
  select id from public.daily_briefings where date = current_date
)
insert into public.briefing_segments (briefing_id, order_index, speaker, text, start_time, end_time)
select briefing.id, segment.order_index, segment.speaker, segment.text, segment.start_time, segment.end_time
from briefing
cross join (
  values
    (0, 'host_a', '좋은 아침이에요. 오늘 꼭 알아야 할 이슈부터 빠르게 볼까요?', 0::numeric, 4::numeric),
    (1, 'host_b', '좋아요. 첫 번째는 미국 금리 이야기예요. 시장이 꽤 예민하게 보고 있죠.', 4::numeric, 9::numeric),
    (2, 'host_a', '결론부터 말하면 당분간은 조심스러운 분위기가 이어질 가능성이 커요.', 9::numeric, 14::numeric),
    (3, 'host_b', '그러면 투자자 입장에서는 속도보다 확인이 더 중요한 하루겠네요.', 14::numeric, 19::numeric)
) as segment(order_index, speaker, text, start_time, end_time)
where not exists (
  select 1
  from public.briefing_segments
  where briefing_segments.briefing_id = briefing.id
);
