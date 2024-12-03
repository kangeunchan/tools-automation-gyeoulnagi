import readline from 'readline';

class UserInputHandler {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    prompt(question) {
        return new Promise((resolve) => this.rl.question(question, resolve));
    }

    async getUserInputs() {
        const inputs = {};
        inputs.githubToken = await this.prompt('GitHub 토큰을 입력하세요: ');
        inputs.googleAIKey = await this.prompt('Google AI 키를 입력하세요: ');
        inputs.aiPrompt = await this.prompt('AI 분석 프롬프트를 입력하세요 (기본값 사용하려면 Enter): ');
        inputs.lookbackDays = parseInt(await this.prompt('분석할 커밋의 기간(일 단위)을 입력하세요: ')) || 7;
        inputs.githubOwner = await this.prompt('GitHub 리포지토리 소유자를 입력하세요: ');
        inputs.githubRepo = await this.prompt('GitHub 리포지토리 이름을 입력하세요: ');
        inputs.outputPath = await this.prompt('PDF 출력 경로를 입력하세요 (기본값: commit_report.pdf): ') || 'commit_report.pdf';

        return inputs;
    }

    close() {
        this.rl.close();
    }
}

export default UserInputHandler;