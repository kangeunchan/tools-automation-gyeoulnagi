const readline = require('readline');
const GitHubService = require('./services/github/github');
const AIAnalysisService = require('./services/AIAnalysis/Gemini');
const PDFReportService = require('./services/PDF/PDF');
const path = require('path');

require('dotenv').config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function prompt(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

(async function main() {
    try {
        const githubToken = await prompt('GitHub 토큰을 입력하세요: ');
        const googleAIKey = await prompt('Google AI 키를 입력하세요: ');
        const aiPrompt = await prompt('AI 분석 프롬프트를 입력하세요 (기본값 사용하려면 Enter): ');
        const lookbackDaysInput = await prompt('분석할 커밋의 기간(일 단위)을 입력하세요: ');
        const githubOwner = await prompt('GitHub 리포지토리 소유자를 입력하세요: ');
        const githubRepo = await prompt('GitHub 리포지토리 이름을 입력하세요: ');
        const outputPathInput = await prompt('PDF 출력 경로를 입력하세요 (기본값: commit_report.pdf): ');

        const githubService = new GitHubService(githubToken || process.env.GITHUB_TOKEN);
        const aiAnalysisService = new AIAnalysisService(googleAIKey || process.env.GOOGLE_AI_KEY);
        const pdfReportService = new PDFReportService();

        aiAnalysisService.setPrompt(aiPrompt || aiAnalysisService.getDefaultPrompt());

        const lookbackDays = parseInt(lookbackDaysInput) || parseInt(process.env.COMMIT_LOOKBACK_DAYS) || 7;

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - lookbackDays);

        const since = startDate.toISOString();
        const until = today.toISOString();

        const owner = githubOwner || process.env.GITHUB_OWNER;
        const repo = githubRepo || process.env.GITHUB_REPO;

        const allCommits = await githubService.fetchAllCommits(owner, repo, since, until);
        console.log(`총 커밋 수: ${allCommits.length}`);

        if (allCommits.length === 0) {
            console.log("분석할 커밋이 없습니다.");
            return;
        }

        const analysisResults = [];

        for (const commit of allCommits) {
            const commitDetails = await githubService.fetchCommitDetails(owner, repo, commit.sha);
            const aiAnalysis = await aiAnalysisService.analyzeCommit(commitDetails);

            analysisResults.push({
                commitSHA: commit.sha,
                commitMessage: commit.commit.message,
                aiAnalysis
            });
        }

        const outputPath = outputPathInput || path.join(process.env.OUTPUT_PATH || 'commit_report.pdf');
        pdfReportService.generatePDFReport(analysisResults, outputPath);

        console.log(`PDF 보고서가 생성되었습니다: ${outputPath}`);
    } catch (error) {
        console.error("오류가 발생했습니다:", error);
    } finally {
        rl.close();
    }
})();
