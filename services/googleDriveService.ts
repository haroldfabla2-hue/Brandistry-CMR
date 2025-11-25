
// Real Google Drive API Service
// Note: In production, you must configure valid Client IDs in Google Cloud Console.

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'; 
const API_KEY = process.env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE';
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

  constructor() {
    // Wait for scripts to load in index.html
    this.waitForScripts();
  }

  private waitForScripts() {
    const checkGapi = setInterval(() => {
      if (window.gapi && window.google) {
        clearInterval(checkGapi);
        this.initializeGapiClient();
      }
    }, 500);
  }

  private async initializeGapiClient() {
    await new Promise<void>((resolve) => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        resolve();
      });
    });

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        this.accessToken = tokenResponse.access_token;
      },
    });
    
    this.isInitialized = true;
  }

  public async signIn(): Promise<void> {
    if (!this.isInitialized) {
      console.warn("Google API not fully initialized yet.");
      return;
    }
    
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
        pageSize: 20,
        fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink, iconLink, modifiedTime)',
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

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.accessToken);
    xhr.send(form);

    return new Promise((resolve, reject) => {
        xhr.onload = function() {
            if (xhr.status === 200) resolve(JSON.parse(xhr.response));
            else reject(xhr.response);
        };
    });
  }
}

export const googleDriveService = new GoogleDriveService();
