/*
  Fix Books / Courses / Chat pages.

  1. Data API grants — Supabase no longer grants table privileges on the public
     schema by default, so every query from the browser failed with a
     "permission denied for table ..." error even though RLS policies existed.
  2. Realtime — the `messages` table must be in the supabase_realtime
     publication or the chat never receives live messages.
  3. Seed content — Books / Courses / Quiz / Chat rendered empty because the
     tables had no rows.
*/

-- 1. GRANTS ------------------------------------------------------------------

-- Public read tables
GRANT SELECT ON public.bible_verses, public.books, public.courses,
  public.quizzes TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.bible_verses,
  public.books, public.book_downloads, public.courses, public.course_progress,
  public.quizzes, public.quiz_results, public.chat_rooms, public.messages,
  public.favorite_verses, public.prayer_requests, public.newsletter_subscribers,
  public.contact_messages TO authenticated;

GRANT SELECT ON public.admin_settings TO authenticated;

-- Anonymous visitors may still submit these public forms (policies gate them)
GRANT INSERT ON public.prayer_requests, public.newsletter_subscribers,
  public.contact_messages TO anon;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. REALTIME ----------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_rooms'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms';
  END IF;
END $$;

ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 3. SEED CONTENT ------------------------------------------------------------

INSERT INTO public.books (title, author, description, cloudinary_url, cover_url, category, file_format)
SELECT * FROM (VALUES
  ('Mere Christianity', 'C. S. Lewis', 'A classic case for the Christian faith, drawn from wartime radio talks.', 'https://www.gutenberg.org/ebooks/1.txt.utf-8', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80', 'Apologetics', 'PDF'),
  ('The Pilgrim''s Progress', 'John Bunyan', 'The allegorical journey of Christian from the City of Destruction to the Celestial City.', 'https://www.gutenberg.org/cache/epub/131/pg131.txt', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80', 'Classic', 'PDF'),
  ('The Imitation of Christ', 'Thomas à Kempis', 'A devotional guide to interior life and following Christ closely.', 'https://www.gutenberg.org/cache/epub/1653/pg1653.txt', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&q=80', 'Devotional', 'PDF'),
  ('Confessions', 'Augustine of Hippo', 'Augustine''s autobiographical account of conversion and grace.', 'https://www.gutenberg.org/cache/epub/3296/pg3296.txt', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=80', 'Theology', 'PDF'),
  ('Humility', 'Andrew Murray', 'A short study on humility as the beauty of holiness.', 'https://www.gutenberg.org/cache/epub/24044/pg24044.txt', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80', 'Spiritual Growth', 'PDF')
) AS v(title, author, description, cloudinary_url, cover_url, category, file_format)
WHERE NOT EXISTS (SELECT 1 FROM public.books);

INSERT INTO public.courses (title, description, youtube_video_id, thumbnail_url, duration, instructor, category)
SELECT * FROM (VALUES
  ('The Bible in One Hour', 'A guided overview of Scripture from Genesis to Revelation.', 'ak06MSETeo4', 'https://i.ytimg.com/vi/ak06MSETeo4/hqdefault.jpg', '1h 02m', 'BibleProject', 'Bible Study'),
  ('How to Read the Bible', 'Practical habits for reading Scripture with understanding.', '7_CGP-12AE0', 'https://i.ytimg.com/vi/7_CGP-12AE0/hqdefault.jpg', '6m', 'BibleProject', 'Bible Study'),
  ('Foundations of Prayer', 'Learning to pray through the Lord''s Prayer.', 'Ii2vAr8HhAg', 'https://i.ytimg.com/vi/Ii2vAr8HhAg/hqdefault.jpg', '12m', 'Grace Book', 'Prayer'),
  ('Understanding Grace', 'What the New Testament means by grace, and why it changes everything.', 'zqZKUqUeAxE', 'https://i.ytimg.com/vi/zqZKUqUeAxE/hqdefault.jpg', '9m', 'Grace Book', 'Theology')
) AS v(title, description, youtube_video_id, thumbnail_url, duration, instructor, category)
WHERE NOT EXISTS (SELECT 1 FROM public.courses);

INSERT INTO public.quizzes (question, options, correct_answer, category, difficulty)
SELECT * FROM (VALUES
  ('Who led the Israelites out of Egypt?', '["Moses","Abraham","David","Elijah"]'::jsonb, 0, 'Bible', 'Easy'),
  ('How many books are in the New Testament?', '["24","27","39","66"]'::jsonb, 1, 'Bible', 'Easy'),
  ('Which apostle denied Jesus three times?', '["John","Thomas","Peter","Andrew"]'::jsonb, 2, 'Bible', 'Easy'),
  ('In which town was Jesus born?', '["Nazareth","Bethlehem","Jerusalem","Capernaum"]'::jsonb, 1, 'Bible', 'Easy'),
  ('Who wrote most of the New Testament letters?', '["Paul","Luke","James","Peter"]'::jsonb, 0, 'Bible', 'Medium'),
  ('What is the first book of the Bible?', '["Exodus","Psalms","Genesis","John"]'::jsonb, 2, 'Bible', 'Easy')
) AS v(question, options, correct_answer, category, difficulty)
WHERE NOT EXISTS (SELECT 1 FROM public.quizzes);

INSERT INTO public.chat_rooms (name, type, is_active)
SELECT * FROM (VALUES
  ('General', 'public', true),
  ('Prayer Requests', 'public', true),
  ('Bible Study', 'public', true)
) AS v(name, type, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE type = 'public');
