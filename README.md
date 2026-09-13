# NORI

뉴스를 이슈 단위로 모아 읽고, 오늘의 브리핑으로 들을 수 있는 모바일 앱입니다.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/034cd9df-fde0-432b-b041-c0dd40076fac" />


## 주요 기능

- 여러 매체의 보도를 이슈별 카드로 모아 탐색
- 주요·경제·정치·사회·테크·세계·컬처 카테고리별 뉴스 보기
- 이슈 검색 및 상세 요약 확인
- 북마크, 좋아요·싫어요, 공유, 신고
- 매일 발행되는 오디오 브리핑 재생
- Google·카카오 로그인과 NORI Pro 구독

## 기술 스택

- Expo SDK 55, React Native 0.83, TypeScript
- Expo Router
- Supabase (뉴스, 브리핑, 인증 및 앱 데이터)
- AsyncStorage를 이용한 네이티브 인증 세션 저장

## 시작하기

필요한 도구: Node.js와 npm, Supabase 프로젝트 및 앱 설정값.

```bash
git clone https://github.com/whoisapple/nori-app.git
cd nori-app
npm install
```

`.env.example`을 복사해 `.env` 파일을 만들고 다음 값을 설정하세요.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

개발 서버를 실행합니다.

```bash
npm start
```

Expo가 출력하는 안내에 따라 기기 또는 시뮬레이터를 선택하거나 다음 명령을 사용할 수 있습니다.

```bash
npm run android
npm run ios
npm run web
```

코드 스타일 검사는 다음과 같이 실행합니다.

```bash
npm run lint
```

Android와 iOS 네이티브 실행에는 각 플랫폼의 개발 도구가 필요합니다. Google·카카오 로그인을 사용하려면 Supabase와 각 OAuth 제공자 설정도 완료해야 합니다.

## 프로젝트 구성

- `src/app`: Expo Router 화면과 경로
- `src/components`: 뉴스 카드, 검색, 공유 및 브리핑 UI
- `src/lib`: Supabase 데이터 접근, 인증, 북마크 및 구독 로직
- `src/hooks`: 뉴스·브리핑·세션 상태 관리
- `supabase`: 로컬 Supabase 설정, 마이그레이션 및 함수

## 환경 설정 참고

브리핑 목업 데이터는 개발 환경에서 기본 사용됩니다. 목업을 끄려면 `EXPO_PUBLIC_USE_MOCK_BRIEFING=false`를 설정하세요.
