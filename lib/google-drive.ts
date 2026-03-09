import { google } from 'googleapis';
import { Readable } from 'stream';

function getAuth() {
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) return null;
  const credentials = JSON.parse(credJson);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

export const DRIVE_CONFIGURED =
  !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
  (!!process.env.DRIVE_FOLDER_SILESIA_AIR || !!process.env.DRIVE_FOLDER_STREAM_AIR);

export const FOLDER_IDS: Record<string, string | undefined> = {
  silesia_air: process.env.DRIVE_FOLDER_SILESIA_AIR,
  stream_air: process.env.DRIVE_FOLDER_STREAM_AIR,
};

export async function uploadToDrive({
  name,
  mimeType = 'application/pdf',
  buffer,
  folderId,
}: {
  name: string;
  mimeType?: string;
  buffer: Buffer;
  folderId: string;
}): Promise<{ fileId: string; webViewLink: string }> {
  const auth = getAuth();
  if (!auth) throw new Error('Google Drive not configured');

  const drive = google.drive({ version: 'v3', auth });
  const stream = Readable.from(buffer);

  const res = await drive.files.create({
    requestBody: { name, parents: [folderId], mimeType },
    media: { mimeType, body: stream },
    fields: 'id,webViewLink',
  });

  return {
    fileId: res.data.id!,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}
