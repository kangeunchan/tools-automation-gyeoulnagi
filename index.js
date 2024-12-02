const { Octokit } = require("@octokit/rest");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const https = require('https');
const os = require('os');
const { exec } = require('child_process');

require('dotenv').config();

/**
 * GitHub API와 상호작용을 담당하는 클래스
 */
class GitHubService {
    /**
     * GitHub API와 상호작용을 위한 초기화
     * @param {string} githubToken - GitHub API 토큰
     */
    constructor(githubToken) {
        this.octokit = new Octokit({ auth: githubToken });
    }

    /**
     * 특정 기간 동안의 저장소 커밋 전체를 가져오는 메서드
     * @param {string} owner - 저장소 소유자
     * @param {string} repo - 저장소 이름
     * @param {string} since - 시작 날짜
     * @param {string} until - 종료 날짜
     * @param {number} perPage - 페이지당 커밋 수
     * @returns {Promise<Array>} 커밋 목록
     */
    async fetchAllCommits(owner, repo, since, until, perPage = 100) {
        let page = 1;
        const allCommits = [];

        while (true) {
            const { data } = await this.octokit.repos.listCommits({
                owner,
                repo,
                since,
                until,
                per_page: perPage,
                page,
            });

            if (data.length === 0) break;

            allCommits.push(...data);
            page++;
        }

        return allCommits;
    }

    /**
     * 특정 커밋의 상세 정보를 가져오는 메서드
     * @param {string} owner - 저장소 소유자
     * @param {string} repo - 저장소 이름
     * @param {string} commitSHA - 커밋 SHA
     * @returns {Promise<Object>} 커밋 상세 정보
     */
    async fetchCommitDetails(owner, repo, commitSHA) {
        const { data: commitDetails } = await this.octokit.repos.getCommit({
            owner,
            repo,
            ref: commitSHA,
        });

        return commitDetails;
    }
}

/**
 * AI 기반 커밋 분석을 담당하는 클래스
 */
class AIAnalysisService {
    /**
     * Google AI API를 사용하기 위한 초기화
     * @param {string} googleAIKey - Google AI API 키
     */
    constructor(googleAIKey) {
        this.genAI = new GoogleGenerativeAI(googleAIKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    /**
     * AI 분석을 위한 커밋 분석 프롬프트 생성 메서드
     * @param {Object} commitDetails - 커밋 상세 정보
     * @returns {string} AI에게 보낼 포맷된 프롬프트
     */
    generateCommitAnalysisPrompt(commitDetails) {
        const { commit, files } = commitDetails;

        // 파일별 변경 사항을 문자열로 포맷팅
        const fileChanges = files.map(file =>
            `파일: ${file.filename}\n상태: ${file.status}\n변경 내용: ${file.patch || '상세 변경 사항 없음'}`
        ).join('\n\n');

        return `다음 git 커밋을 분석해주세요:
                커밋 메시지: ${commit.message}
                커밋 작성자: ${commit.author.name}
                커밋 날짜: ${commit.author.date}

                파일 변경 사항:
                ${fileChanges}

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

    /**
     * AI를 사용하여 커밋 분석을 수행하는 메서드
     * @param {Object} commitDetails - 커밋 상세 정보
     * @returns {Promise<string>} AI 분석 결과
     */
    async analyzeCommit(commitDetails) {
        const prompt = this.generateCommitAnalysisPrompt(commitDetails);
        const aiResult = await this.model.generateContent(prompt);
        return aiResult.response.text();
    }
}

/**
 * PDF 파일 생성을 담당하는 클래스
 */
class PDFReportService {
    /**
     * PDF 파일로 커밋 분석 결과를 저장하는 메서드
     * @param {Array} analysisResults - 커밋 분석 결과 배열
     * @param {string} outputPath - PDF 파일 저장 경로
     */
    generatePDFReport(analysisResults, outputPath) {
        const doc = new PDFDocument({
            autoFirstPage: false,
            bufferPages: true
        });

        doc.pipe(fs.createWriteStream(outputPath));

        // NanumGothicCoding 폰트 경로
        const fontPath = path.join(__dirname, 'fonts/NanumGothicCoding-2.5/NanumGothicCoding.ttf');

        // PDFKit에 한글 폰트 등록
        try {
            doc.registerFont('NanumGothicCoding', fontPath);
        } catch (error) {
            console.error('폰트 등록 실패:', error);
            console.log('기본 폰트로 대체합니다.');
        }

        analysisResults.forEach(result => {
            doc.addPage({
                size: 'A4',
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            })
            .fontSize(12)
            .font('NanumGothicCoding') // 등록한 폰트 사용
            .text(`커밋 SHA: ${result.commitSHA}`, { underline: true })
            .moveDown()
            .text(`커밋 메시지: ${result.commitMessage}`)
            .moveDown()
            .text("커밋 분석 결과:")
            .moveDown()
            .text(result.aiAnalysis, {
                align: 'justify',
                lineGap: 3
            });
        });

        doc.end();
        console.log(`PDF 파일이 생성되었습니다: ${outputPath}`);
    }
}



async function main() {
    try {
        const githubService = new GitHubService(process.env.GITHUB_TOKEN);
        const aiAnalysisService = new AIAnalysisService(process.env.GOOGLE_AI_KEY);
        const pdfReportService = new PDFReportService();

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 13);

        const since = startDate.toISOString();
        const until = today.toISOString();

        const allCommits = await githubService.fetchAllCommits("kangeunchan", "Algorithm", since, until);
        console.log(`총 커밋 수: ${allCommits.length}`);

        if(allCommits.length === 0) {
            console.log("분석할 커밋이 없습니다.");
            return;
        }

        const analysisResults = [];

        for (const commit of allCommits) {
            const commitDetails = await githubService.fetchCommitDetails("kangeunchan", "Algorithm", commit.sha);
            const aiAnalysis = await aiAnalysisService.analyzeCommit(commitDetails);

            analysisResults.push({
                commitSHA: commit.sha,
                commitMessage: commit.commit.message,
                aiAnalysis
            });
        }

        const outputPath = path.join(__dirname, 'commit_report.pdf');
        pdfReportService.generatePDFReport(analysisResults, outputPath);
    } catch (error) {
        console.error("오류가 발생했습니다:", error);
    }
}

main();