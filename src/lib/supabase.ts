import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  // Do NOT throw here: a module-level throw blanks the whole app in production.
  // Log loudly and fall back to a harmless placeholder client so the UI still renders.
  console.error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables (locally in .env, and in your Netlify site settings).',
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    },
  },
);

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
export const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY as string;

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
