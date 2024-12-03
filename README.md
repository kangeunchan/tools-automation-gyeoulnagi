
# **GitHub 커밋 분석 도구**

## ✨ **소개**
이 도구는 GitHub 저장소에서 커밋을 자동으로 가져와 **Google Gemini AI**로 분석한 후, 각 커밋에 대한 인사이트가 담긴 **PDF 보고서**를 생성합니다.



## 📋 **필수 요구사항**
- **Node.js** (v14 이상 권장)
- **GitHub 개인 접근 토큰**
- **Google AI API 키**



## 🛠 **설치 방법**

### 1️⃣ **저장소 클론**

```bash
git clone https://github.com/kangeunchan/tools-automation-gyeoulnagi.git
cd github-commit-analyzer
```

### 2️⃣ **의존성 설치**

```bash
npm install
```

### 3️⃣ **환경 설정**

프로젝트 루트에 `.env` 파일을 생성하고 아래와 같은 설정을 추가합니다:

```env
GITHUB_TOKEN=깃허브_개인_접근_토큰
GOOGLE_AI_KEY=구글_AI_API_키
GITHUB_OWNER=저장소_소유자
GITHUB_REPO=저장소_이름
COMMIT_LOOKBACK_DAYS=30
OUTPUT_PATH=./commit_report.pdf
AI_PROMPT=선택적_맞춤_프롬프트
```



## ⚙️ **구성 매개변수**

| 매개변수                | 설명                                                     |
|-------------------------|----------------------------------------------------------|
| `GITHUB_TOKEN`          | GitHub 저장소에 접근할 수 있는 개인 접근 토큰           |
| `GOOGLE_AI_KEY`         | Google Gemini AI API 키                                  |
| `GITHUB_OWNER`          | GitHub 저장소의 소유자                                    |
| `GITHUB_REPO`           | GitHub 저장소의 이름                                      |
| `COMMIT_LOOKBACK_DAYS`  | 조회할 커밋의 일수 (기본값: 30일)                        |
| `OUTPUT_PATH`           | PDF 보고서 저장 경로 (기본값: `./commit_report.pdf`)     |
| `AI_PROMPT`             | 선택적 맞춤 AI 분석 프롬프트 (미제공 시 기본값 사용)     |



## 🚀 **사용 방법**

애플리케이션을 실행하려면 아래 명령어를 입력하세요:

```bash
npm start
```

### 이 도구는 자동으로 다음 작업을 수행합니다:
1. 지정된 **GitHub 저장소**에서 커밋을 가져옵니다.
2. **Gemini AI**를 통해 각 커밋을 분석합니다.
3. **PDF 보고서**에 커밋 인사이트를 작성하여 생성합니다.



## 📦 **의존성**

- `@octokit/rest`: GitHub API 클라이언트
- `@google/generative-ai`: Google AI SDK
- `pdfkit`: PDF 문서 생성 라이브러리
- `dotenv`: 환경 변수 관리



## 🔧 **사용자 정의**

- `.env` 파일의 `AI_PROMPT`를 수정하여 AI 분석 프롬프트를 커스터마이즈할 수 있습니다.
- `Gemini.js`의 `getDefaultPrompt()` 메서드를 변경하여 기본 분석 프롬프트를 수정할 수 있습니다.



## 🛠 **문제 해결**

- 모든 환경 변수가 정확히 설정되었는지 확인하세요.
- 의존성의 최신 버전이 설치되었는지 확인하세요.
- GitHub 및 Google AI API 자격 증명이 올바른지 점검하세요.
