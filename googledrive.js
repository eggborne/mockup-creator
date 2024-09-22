import { OAUTH2_CLIENT_ID } from './secret.json' assert { type: 'json' };

const CLIENT_ID = OAUTH2_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

function loadGoogleAPI() {
  return new Promise((resolve) => {
    gapi.load('client:auth2', resolve);
  });
}

async function initGoogleAPI() {
  await gapi.client.init({
    clientId: CLIENT_ID,
    scope: SCOPES,
  });
}

async function handleDriveUpload() {
  await loadGoogleAPI();
  await initGoogleAPI();

  const authInstance = gapi.auth2.getAuthInstance();

  if (!authInstance.isSignedIn.get()) {
    await authInstance.signIn();
  }

  uploadFileToDrive();
}

function uploadFileToDrive() {
  saveImageBlob(async (blob) => {
    const fileName = 'mockup_image.jpg'; // Customize as needed

    const metadata = {
      name: fileName,
      mimeType: 'image/jpeg',
    };

    const accessToken = gapi.auth.getToken().access_token;

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', blob);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
        body: form,
      }
    );

    const result = await response.json();

    if (result.id) {
      alert('File uploaded to Google Drive with ID: ' + result.id);
    } else {
      console.error('Upload failed:', result);
      alert('Failed to upload file to Google Drive.');
    }
  });
}

// Modify saveImage to return a blob
function saveImageBlob(callback) {
  const renderer = pixi.renderer;
  const tempCanvas = document.createElement('canvas');
  const tempContext = tempCanvas.getContext('2d');
  tempCanvas.width = pixi.view.width;
  tempCanvas.height = pixi.view.height;
  renderer.render(pixi.stage);
  tempContext.drawImage(renderer.view, 0, 0);
  tempCanvas.toBlob(callback, 'image/jpeg', 1);
}

export default handleDriveUpload;