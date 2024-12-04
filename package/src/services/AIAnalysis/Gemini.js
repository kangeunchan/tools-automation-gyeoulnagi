import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI 기반 커밋 분석을 담당하는 클래스
 */
class AIAnalysisService {
    constructor(googleAIKey, defaultPrompt) {
        this.genAI = new GoogleGenerativeAI(googleAIKey);
        this.model = this.genAI.getGenerativeModel({ model: process.env.model || "gemini-1.5-flash" });
        this.prompt = defaultPrompt || this.getDefaultPrompt();
    }

    getDefaultPrompt() {
        return `다음 git 커밋을 분석해주세요:
                커밋 메시지: {커밋 메시지}
                커밋 작성자: {커밋 작성자}
                커밋 날짜: {커밋 날짜}

                파일 변경 사항:
                {파일 변경 사항}

                답변에 대해서 무조건 지켜야 할 규칙:
                1. 답변은 최소 A4용지 3분의 1 이상은 되야한다.
                2. 답변은 코드를 작성한 사람이 작성한 것이라고 가정한다.
                3. 답변은 명확한 사실만 기술해야한다.
                4. 답변 포멧 :
                    공부했던 내용 : {공부했던 내용}
                    작성된 기능 : {공부했던 내용}
                    아쉬웠던 부분 : {공부했던 내용}
                5. GIT 커밋에 대한 내용은 절때 언급하지 않는다.
                6. '입니다'체 말고 '다', 혹은 '~이다'체로 작성한다.

                다음 사항에 대해 인사이트를 제공해주세요:
                1. 이 코드를 작성하기 위해 공부했던(해야했던 내용)
                2. 코드로 작성된 기능
                3. 주목할 만한 패턴 또는 개선 사항
                `;
    }

    setPrompt(customPrompt) {
        this.prompt = customPrompt || this.getDefaultPrompt();
    }

    generateCommitAnalysisPrompt(commitDetails) {
        const { commit, files } = commitDetails;
        const fileChanges = files.map(file =>
            `파일: ${file.filename}\n상태: ${file.status}\n변경 내용: ${file.patch || '상세 변경 사항 없음'}`
        ).join('\n\n');

        return this.prompt
            .replace('{커밋 메시지}', commit.message)
            .replace('{커밋 작성자}', commit.author.name)
            .replace('{커밋 날짜}', commit.author.date)
            .replace('{파일 변경 사항}', fileChanges);
    }

    async analyzeCommit(commitDetails) {
        const prompt = this.generateCommitAnalysisPrompt(commitDetails);
        const aiResult = await this.model.generateContent(prompt);
        return aiResult.response.text();
    }
}

export default AIAnalysisService;