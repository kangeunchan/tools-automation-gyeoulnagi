import { Octokit } from "@octokit/rest";

/**
 * GitHub API와 상호작용을 담당하는 클래스
 */
class GitHubService {
    constructor(githubToken) {
        this.octokit = new Octokit({ auth: githubToken });
    }

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

    async fetchCommitDetails(owner, repo, commitSHA) {
        const { data: commitDetails } = await this.octokit.repos.getCommit({
            owner,
            repo,
            ref: commitSHA,
        });

        return commitDetails;
    }
}

export default GitHubService;
