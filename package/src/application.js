import GitHubService from './services/github/Github.js';
import AIAnalysisService from './services/AIAnalysis/Gemini.js';
import PDFReportService from './services/PDF/PDF.js';
import UserInputHandler from './services/input/Input.js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

(async function main() {
    const inputHandler = new UserInputHandler();
    try {
        const userInputs = await inputHandler.getUserInputs();

        const githubService = new GitHubService(userInputs.githubToken || process.env.GITHUB_TOKEN);
        const aiAnalysisService = new AIAnalysisService(userInputs.googleAIKey || process.env.GOOGLE_AI_KEY);
        const pdfReportService = new PDFReportService();

        aiAnalysisService.setPrompt(userInputs.aiPrompt || aiAnalysisService.getDefaultPrompt());

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - userInputs.lookbackDays);

        const since = startDate.toISOString();
        const until = today.toISOString();

        const owner = userInputs.githubOwner || process.env.GITHUB_OWNER;
        const repo = userInputs.githubRepo || process.env.GITHUB_REPO;

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

        const outputPath = path.join(userInputs.outputPath);
        pdfReportService.generatePDFReport(analysisResults, outputPath);

        console.log(`PDF 보고서가 생성되었습니다: ${outputPath}`);
    } catch (error) {
        console.error("오류가 발생했습니다:", error);
    } finally {
        inputHandler.close();
    }
})();
