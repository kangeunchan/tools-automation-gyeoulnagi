const GitHubService = require('./services/github/github');
const AIAnalysisService = require('./services/AIAnalysis/Gemini');
const PDFReportService = require('./services/PDF/PDF');
const path = require('path');
const { get } = require('http');

require('dotenv').config();

(async function main() {
    try {
        const githubService = new GitHubService(process.env.GITHUB_TOKEN);
        const aiAnalysisService = new AIAnalysisService(process.env.GOOGLE_AI_KEY);
        const pdfReportService = new PDFReportService();

        aiAnalysisService.setPrompt(process.env.AI_PROMPT || aiAnalysisService.getDefaultPrompt());

        const lookbackDays = parseInt(process.env.COMMIT_LOOKBACK_DAYS);


        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - lookbackDays);

        const since = startDate.toISOString();
        const until = today.toISOString();

        const owner = process.env.GITHUB_OWNER;
        const repo = process.env.GITHUB_REPO;

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

        const outputPath = path.join(process.env.OUTPUT_PATH || 'commit_report.pdf');
        pdfReportService.generatePDFReport(analysisResults, outputPath);
    } catch (error) {
        console.error("오류가 발생했습니다:", error);
    }
})();
