/**
 * GitHub Storage Service
 * Manages file operations using GitHub API
 */

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  download_url: string;
  type: 'file' | 'dir';
}

export interface GitHubUploadResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
    url: string;
    html_url: string;
    download_url: string;
  };
  commit: {
    sha: string;
    message: string;
  };
}

export class GitHubStorage {
  private token: string;
  private owner: string;
  private repo: string;
  private branch: string;
  private baseUrl: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN || '';
    this.owner = process.env.GITHUB_OWNER || '';
    this.repo = process.env.GITHUB_REPO || '';
    this.branch = process.env.GITHUB_BRANCH || 'main';
    this.baseUrl = 'https://api.github.com';

    if (!this.token || !this.owner || !this.repo) {
      throw new Error('GitHub credentials not configured. Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.');
    }
  }

  /**
   * Get headers for GitHub API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * List files in a directory
   */
  async listFiles(path: string = ''): Promise<GitHubFile[]> {
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Directory doesn't exist yet
        }
        const error = await response.json();
        throw new Error(error.message || 'Failed to list files');
      }

      const data = await response.json();
      
      // If single file, return as array
      if (!Array.isArray(data)) {
        return [data];
      }

      return data;
    } catch (error: any) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Upload a file to GitHub
   */
  async uploadFile(
    path: string,
    content: Buffer | string,
    message: string = 'Upload file via File Explorer'
  ): Promise<GitHubUploadResponse> {
    try {
      // Convert buffer to base64
      const base64Content = Buffer.isBuffer(content) 
        ? content.toString('base64')
        : Buffer.from(content).toString('base64');

      // Check if file exists to get SHA for update
      let sha: string | undefined;
      try {
        const existingFile = await this.getFile(path);
        sha = existingFile.sha;
      } catch (error) {
        // File doesn't exist, that's fine for new upload
      }

      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      const body: any = {
        message,
        content: base64Content,
        branch: this.branch,
      };

      if (sha) {
        body.sha = sha; // Include SHA for update
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Get file details
   */
  async getFile(path: string): Promise<GitHubFile> {
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'File not found');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  /**
   * Download file content
   */
  async downloadFile(path: string): Promise<Buffer> {
    try {
      const file = await this.getFile(path);
      
      if (!file.download_url) {
        throw new Error('Download URL not available');
      }

      const response = await fetch(file.download_url);
      
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(
    path: string,
    message: string = 'Delete file via File Explorer'
  ): Promise<void> {
    try {
      // Get file SHA first
      const file = await this.getFile(path);
      
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${path}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          sha: file.sha,
          branch: this.branch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
      }
    } catch (error: any) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Get repository info
   */
  async getRepoInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get repository info');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error getting repo info:', error);
      throw error;
    }
  }

  /**
   * Get raw file URL
   */
  getRawUrl(path: string): string {
    return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
  }

  /**
   * Get web URL
   */
  getWebUrl(path: string): string {
    return `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${path}`;
  }
}

// Export singleton instance
let githubStorage: GitHubStorage | null = null;

export function getGitHubStorage(): GitHubStorage {
  if (!githubStorage) {
    githubStorage = new GitHubStorage();
  }
  return githubStorage;
}
