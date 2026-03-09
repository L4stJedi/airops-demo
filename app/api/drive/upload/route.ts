import { NextRequest, NextResponse } from 'next/server';
import { uploadToDrive, FOLDER_IDS } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  let fileName = 'document.pdf';
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    fileName = (formData.get('name') as string) || fileName;
    const company = (formData.get('company') as string) || 'silesia_air';
    const mimeType = (formData.get('mimeType') as string) || 'application/pdf';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const folderId = FOLDER_IDS[company];

    // Demo mode fallback — no credentials configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !folderId) {
      return NextResponse.json({
        success: true,
        demo: true,
        fileId: `demo-${Date.now()}`,
        webViewLink: null,
        name: fileName,
        message: 'Uloženo v demo režimu (Google Drive není nakonfigurováno)',
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToDrive({ name: fileName, mimeType, buffer, folderId });

    return NextResponse.json({
      success: true,
      demo: false,
      fileId: result.fileId,
      webViewLink: result.webViewLink,
      name: fileName,
    });
  } catch (err) {
    console.error('[Drive upload]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
