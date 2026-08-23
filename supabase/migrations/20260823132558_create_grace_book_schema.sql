/*
# Create Grace Book schema

Creates all tables for the Grace Book Christian web app:
profiles, bible_verses, books, book_downloads, courses, course_progress,
quizzes, quiz_results, chat_rooms, messages, favorite_verses,
admin_settings, prayer_requests, newsletter_subscribers, contact_messages.

## Security model
- Public content tables (bible_verses, books, courses, quizzes): readable by anon+authenticated, writable by authenticated only.
- User-specific tables (book_downloads, course_progress, quiz_results, favorite_verses): owner-scoped via auth.uid().
- Chat tables (chat_rooms, messages): readable by authenticated, messages writable by owner.
- Profiles: readable by authenticated, editable by owner.
- Admin tables (admin_settings, contact_messages, newsletter_subscribers, prayer_requests): readable by authenticated (admin), writable by authenticated.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ BIBLE VERSES ============
CREATE TABLE IF NOT EXISTS bible_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_text text NOT NULL,
  reference text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  verse_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verses_select_all" ON bible_verses;
CREATE POLICY "verses_select_all" ON bible_verses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "verses_insert_auth" ON bible_verses;
CREATE POLICY "verses_insert_auth" ON bible_verses FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "verses_update_auth" ON bible_verses;
CREATE POLICY "verses_update_auth" ON bible_verses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "verses_delete_auth" ON bible_verses;
CREATE POLICY "verses_delete_auth" ON bible_verses FOR DELETE
  TO authenticated USING (true);

-- ============ BOOKS ============
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text,
  cloudinary_url text NOT NULL DEFAULT '',
  cover_url text,
  category text NOT NULL DEFAULT 'General',
  file_format text NOT NULL DEFAULT 'PDF',
  downloads_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_select_all" ON books;
CREATE POLICY "books_select_all" ON books FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "books_insert_auth" ON books;
CREATE POLICY "books_insert_auth" ON books FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "books_update_auth" ON books;
CREATE POLICY "books_update_auth" ON books FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "books_delete_auth" ON books;
CREATE POLICY "books_delete_auth" ON books FOR DELETE
  TO authenticated USING (true);

-- ============ BOOK DOWNLOADS ============
CREATE TABLE IF NOT EXISTS book_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
ALTER TABLE book_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "downloads_select_own" ON book_downloads;
CREATE POLICY "downloads_select_own" ON book_downloads FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_insert_own" ON book_downloads;
CREATE POLICY "downloads_insert_own" ON book_downloads FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "downloads_delete_own" ON book_downloads;
CREATE POLICY "downloads_delete_own" ON book_downloads FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ COURSES ============
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  youtube_video_id text NOT NULL DEFAULT '',
  thumbnail_url text,
  duration text,
  instructor text,
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_select_all" ON courses;
CREATE POLICY "courses_select_all" ON courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "courses_insert_auth" ON courses;
CREATE POLICY "courses_insert_auth" ON courses FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "courses_update_auth" ON courses;
CREATE POLICY "courses_update_auth" ON courses FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "courses_delete_auth" ON courses;
CREATE POLICY "courses_delete_auth" ON courses FOR DELETE
  TO authenticated USING (true);

-- ============ COURSE PROGRESS ============
CREATE TABLE IF NOT EXISTS course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_select_own" ON course_progress;
CREATE POLICY "progress_select_own" ON course_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_insert_own" ON course_progress;
CREATE POLICY "progress_insert_own" ON course_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_update_own" ON course_progress;
CREATE POLICY "progress_update_own" ON course_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "progress_delete_own" ON course_progress;
CREATE POLICY "progress_delete_own" ON course_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ QUIZZES ============
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer integer NOT NULL,
  category text NOT NULL DEFAULT 'Bible',
  difficulty text NOT NULL DEFAULT 'Easy',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select_all" ON quizzes;
CREATE POLICY "quizzes_select_all" ON quizzes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_insert_auth" ON quizzes;
CREATE POLICY "quizzes_insert_auth" ON quizzes FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "quizzes_update_auth" ON quizzes;
CREATE POLICY "quizzes_update_auth" ON quizzes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "quizzes_delete_auth" ON quizzes;
CREATE POLICY "quizzes_delete_auth" ON quizzes FOR DELETE
  TO authenticated USING (true);

-- ============ QUIZ RESULTS ============
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  category text,
  time_taken integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quiz_results_select_all" ON quiz_results;
CREATE POLICY "quiz_results_select_all" ON quiz_results FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "quiz_results_insert_own" ON quiz_results;
CREATE POLICY "quiz_results_insert_own" ON quiz_results FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_results_update_own" ON quiz_results;
CREATE POLICY "quiz_results_update_own" ON quiz_results FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_results_delete_own" ON quiz_results;
CREATE POLICY "quiz_results_delete_own" ON quiz_results FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ CHAT ROOMS ============
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  participants jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_rooms_select_all" ON chat_rooms;
CREATE POLICY "chat_rooms_select_all" ON chat_rooms FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "chat_rooms_insert_auth" ON chat_rooms;
CREATE POLICY "chat_rooms_insert_auth" ON chat_rooms FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "chat_rooms_update_auth" ON chat_rooms;
CREATE POLICY "chat_rooms_update_auth" ON chat_rooms FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "chat_rooms_delete_auth" ON chat_rooms;
CREATE POLICY "chat_rooms_delete_auth" ON chat_rooms FOR DELETE
  TO authenticated USING (true);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  attachment_url text,
  reply_to uuid REFERENCES messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_all" ON messages;
CREATE POLICY "messages_select_all" ON messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "messages_insert_own" ON messages;
CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_update_own" ON messages;
CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "messages_delete_own" ON messages;
CREATE POLICY "messages_delete_own" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- ============ FAVORITE VERSES ============
CREATE TABLE IF NOT EXISTS favorite_verses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  verse_id uuid NOT NULL REFERENCES bible_verses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, verse_id)
);
ALTER TABLE favorite_verses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fav_verses_select_own" ON favorite_verses;
CREATE POLICY "fav_verses_select_own" ON favorite_verses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_verses_insert_own" ON favorite_verses;
CREATE POLICY "fav_verses_insert_own" ON favorite_verses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "fav_verses_delete_own" ON favorite_verses;
CREATE POLICY "fav_verses_delete_own" ON favorite_verses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ ADMIN SETTINGS ============
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_password text NOT NULL DEFAULT '',
  site_name text NOT NULL DEFAULT 'Grace Book',
  youtube_channel_id text NOT NULL DEFAULT ''
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_settings_select_auth" ON admin_settings;
CREATE POLICY "admin_settings_select_auth" ON admin_settings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_settings_insert_auth" ON admin_settings;
CREATE POLICY "admin_settings_insert_auth" ON admin_settings FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_settings_update_auth" ON admin_settings;
CREATE POLICY "admin_settings_update_auth" ON admin_settings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- ============ PRAYER REQUESTS ============
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  request text NOT NULL,
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prayer_select_auth" ON prayer_requests;
CREATE POLICY "prayer_select_auth" ON prayer_requests FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "prayer_insert_all" ON prayer_requests;
CREATE POLICY "prayer_insert_all" ON prayer_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "prayer_delete_auth" ON prayer_requests;
CREATE POLICY "prayer_delete_auth" ON prayer_requests FOR DELETE
  TO authenticated USING (true);

-- ============ NEWSLETTER SUBSCRIBERS ============
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletter_select_auth" ON newsletter_subscribers;
CREATE POLICY "newsletter_select_auth" ON newsletter_subscribers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "newsletter_insert_all" ON newsletter_subscribers;
CREATE POLICY "newsletter_insert_all" ON newsletter_subscribers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_delete_auth" ON newsletter_subscribers;
CREATE POLICY "newsletter_delete_auth" ON newsletter_subscribers FOR DELETE
  TO authenticated USING (true);

-- ============ CONTACT MESSAGES ============
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_select_auth" ON contact_messages;
CREATE POLICY "contact_select_auth" ON contact_messages FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "contact_insert_all" ON contact_messages;
CREATE POLICY "contact_insert_all" ON contact_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "contact_delete_auth" ON contact_messages;
CREATE POLICY "contact_delete_auth" ON contact_messages FOR DELETE
  TO authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);
CREATE INDEX IF NOT EXISTS idx_quiz_results_score ON quiz_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_book_downloads_user ON book_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_verses_user ON favorite_verses(user_id);
CREATE INDEX IF NOT EXISTS idx_bible_verses_date ON bible_verses(verse_date);

-- Enable realtime for chat
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
  END IF;
END $$;