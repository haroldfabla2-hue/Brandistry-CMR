
// Real Google Drive API Service
// Documentation: https://developers.google.com/drive/api/v3/reference/

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

class GoogleDriveService {
  private tokenClient: any;
  private accessToken: string | null = null;
  private isInitialized = false;
  private apiKey: string = '';
  private clientId: string = '';

  constructor() {
    // Scripts are loaded in index.html, we just wait for them when init is called
  }

  public async init(apiKey: string, clientId: string): Promise<void> {
    this.apiKey = apiKey;
    this.clientId = clientId;

    if (!this.apiKey || !this.clientId) {
      throw new Error("Missing Google API Credentials");
    }

    await this.waitForScripts();
    await this.initializeGapiClient();
  }

  private waitForScripts() {
    return new Promise<void>((resolve) => {
      const checkGapi = setInterval(() => {
        if (window.gapi && window.google) {
          clearInterval(checkGapi);
          resolve();
        }
      }, 100);
    });
  }

  private async initializeGapiClient() {
    if (this.isInitialized) return;

    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: this.apiKey,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
            this.accessToken = tokenResponse.access_token;
        }
      },
    });
    
    this.isInitialized = true;
  }

  public async signIn(): Promise<void> {
    if (!this.isInitialized) throw new Error("Service not initialized. Call init() first.");
    
    // If we already have a token, just resolve
    if (this.accessToken) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(resp);
        }
        this.accessToken = resp.access_token;
        resolve();
      };
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  public get isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public async listFiles(folderId: string = 'root') {
    if (!this.accessToken) throw new Error("Not authenticated");

    try {
      const response = await window.gapi.client.drive.files.list({
        pageSize: 50,
        fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, modifiedTime, parents)',
        q: `'${folderId}' in parents and trashed = false`,
        orderBy: 'folder, modifiedTime desc'
      });
      return response.result.files;
    } catch (error) {
      console.error("Error listing files", error);
      throw error;
    }
  }

  public async uploadFile(file: File, folderId: string = 'root') {
    if (!this.accessToken) throw new Error("Not authenticated");

    const metadata = {
      name: file.name,
      mimeType: file.type,
      parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.accessToken
      },
      body: form
    }).then(res => res.json());
  }

  public async createFolder(name: string, parentId: string = 'root') {
    if (!this.accessToken) throw new Error("Not authenticated");

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    return window.gapi.client.drive.files.create({
      resource: metadata,
      fields: 'id'
    });
  }

  public async deleteFile(fileId: string) {
    if (!this.accessToken) throw new Error("Not authenticated");
    
    return window.gapi.client.drive.files.delete({
      fileId: fileId
    });
  }
}

export const googleDriveService = new GoogleDriveService();
