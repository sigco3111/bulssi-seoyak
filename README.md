# 불씨의 서약 (Ember's Vow) — 이전·수정 배포본

유튜브 채널 **리드어세상**의 영상 16 「AI로 만든 게임, 부업이 될까」에서 공개한 three.js 웹게임 「불씨의 서약」의 소스를 원작자의 이용 조건에 따라 옮겨 온 저장소입니다.

- 원작 자료실: https://readasesang-lab.vercel.app/v16/
- 원작 게임: https://ember-vow-gamma.vercel.app
- 원작자가 배포한 소스 묶음의 안내 문서: `README_먼저읽기.md` (원문 보존)

## 원작 이용 조건

원작자가 자료실과 소스 묶음에 직접 밝힌 조건입니다.

> 이 소스(코드, 이름, 이야기, 그림)는 자유롭게 고쳐 쓰셔도 됩니다. 그대로 다시 올려 파는 것만 하지 말아 주세요.

이 저장소는 비영리로 공개되며, 원작을 판매하지 않습니다.

## 이 배포본에서 바뀐 것

원작 자산 중 재배포 권한 근거를 확보하지 못한 오디오를 빼고 다음과 같이 수정했습니다.

1. **배경 음악 11곡 제외** — 원작 음악은 Google Flow Music으로 생성된 곡으로, 재배포를 허용하는 공식 약관 근거를 확인하지 못했습니다(원작자도 재배포 전 이용 조건 확인을 권고). `presentation/audio-assets.js`의 `MUSIC`을 비웠고, 음악이 없어도 게임이 정상 동작하도록 `presentation/audio.js`를 수정했습니다.
2. **효과음 41개 전량 자체 합성 대체** — 원작 효과음(Flow Spaces로 만든 wav)도 같은 이유로 제외하고, 이 저장소에서 ffmpeg 절차 합성으로 만든 파일(`assets/audio/synth/`)로 교체했습니다.
3. 소리 설정·로딩 화면 등 음악 관련 안내 문구를 현재 상태에 맞게 고쳤습니다.

그 외 코드, 디자인 데이터(`design/game-design.json`의 직업·기술·장비·밸런스), 3D 모델, 원화는 원작 그대로입니다.

## 실행

- **웹 빌드**: `docs/` 폴더가 GitHub Pages용 정적 빌드입니다. 로컬에서 보려면 이 폴더를 정적 서버로 열면 됩니다(예: `npx serve docs`).
- **소스에서 다시 빌드**: Node.js 설치 후

```
npm install
node design/build.mjs --free     # 단일 HTML판 (design/dist/)
node design/build.mjs --web      # 정적 웹폴더판 (design/dist/web/)
```

자세한 원작 빌드 안내는 `README_먼저읽기.md`를 참고하세요.

## 사용된 것과 조건

| 항목 | 출처 | 조건 |
|---|---|---|
| 사람 3D 모델·동작 | Quaternius (`design/game-design.json`의 `assetCredits` 참고) | CC0 |
| 탈것 모델(말·사슴·늑대) | Quaternius 동물 팩으로 추정(원작 소스에 별도 크레딧 없음) | 확인 중 |
| 3D 엔진 | three.js 0.187 | MIT |
| 폰트 | Hahmlet | SIL OFL 1.1 (`presentation/licenses/`) |
| 표지·인물·몬스터 원화 | 원작자가 AI로 생성 (프롬프트: `presentation/art/generated/prompts/`) | 원작자 조건 적용 |
| 배경 음악 | Google Flow Music (AI 생성) | **이 배포본에서 제외** — 재배포 권한 미확보 |
| 효과음 | 원작은 Flow Spaces 생성 | **자체 합성으로 교체** |

## 상태

원작 기준 알파 단계 프로토타입입니다. 싱글플레이 전용이며 서버·로그인·결제 기능이 없고, 저장은 브라우저에만 남습니다.
