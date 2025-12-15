import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'chatfusion_avatars',
          public_id: `avatar_${user.id}`, // Overwrite existing avatar
          overwrite: true,
          resource_type: 'image',
          transformation: [
              { width: 500, height: 500, crop: "fill", gravity: "face" } // Optional: crop to face
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: (result as any).secure_url }, { status: 200 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
