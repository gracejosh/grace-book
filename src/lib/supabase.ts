import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oeshszodnfjlrntqzffb.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lc2hzem9kbmZqbHJudHF6ZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjA2MzksImV4cCI6MjEwMjYzNjYzOX0.B2QfJa0hXrX4JUfkfRDFFk2v_aBa_7ygPtB2TFl1Gv4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const CLOUDINARY_CLOUD_NAME = 'grace.book';
export const CLOUDINARY_UPLOAD_PRESET = 'grace_preset';
export const CLOUDINARY_API_KEY = '8IfOPMrV8w6Mh85iQLMQy_qUryU';

export async function uploadToCloudinary(file: File, resourceType: 'image' | 'raw' | 'video' = 'image'): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('api_key', CLOUDINARY_API_KEY);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error('Upload failed');
  const data = await response.json();
  return data.secure_url as string;
}
