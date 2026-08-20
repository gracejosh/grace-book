import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, uploadToCloudinary } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { BibleVerse, Book, Course, Quiz as QuizType, Profile, PrayerRequest, ContactMessage, NewsletterSubscriber } from '@/types';
import { Lock, LayoutDashboard, BookOpen, Library, GraduationCap, BrainCircuit, Users, Mail, Plus, Edit2, Trash2, X, Download, TrendingUp, Award, MessageSquare, Heart, FileText } from 'lucide-react';
import { EmptyState } from '@/components/ui';

const ADMIN_PASSWORD = 'grace2024';
type Tab = 'dashboard' | 'verses' | 'books' | 'courses' | 'quizzes' | 'users' | 'messages';

export default function Admin() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      showToast('Welcome, Admin!', 'success');
    } else {
      showToast('Wrong password', 'error');
    }
  };

  if (!authed) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="glass-card p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-gold-500 mb-4 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Admin Access</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enter the admin password to continue</p>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Admin password" autoFocus />
              <button type="submit" className="btn-primary w-full">Access Dashboard</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'verses', label: 'Verses', icon: BookOpen },
    { id: 'books', label: 'Books', icon: Library },
    { id: 'courses', label: 'Courses', icon: GraduationCap },
    { id: 'quizzes', label: 'Quizzes', icon: BrainCircuit },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'messages', label: 'Messages', icon: Mail },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-gold-500 flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-slate-500">Manage all content and users</p>
          </div>
          {profile?.is_admin && <span className="ml-auto px-3 py-1 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 text-sm font-semibold">Verified Admin</span>}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg' : 'glass hover:scale-105'}`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'verses' && <VersesTab showToast={showToast} />}
        {tab === 'books' && <BooksTab showToast={showToast} />}
        {tab === 'courses' && <CoursesTab showToast={showToast} />}
        {tab === 'quizzes' && <QuizzesTab showToast={showToast} />}
        {tab === 'users' && <UsersTab showToast={showToast} />}
        {tab === 'messages' && <MessagesTab />}
      </div>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState({ users: 0, books: 0, downloads: 0, quizzes: 0, messages: 0, verses: 0, courses: 0 });
  const [recent, setRecent] = useState<{ id: string; score: number; category: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [u, b, dl, q, m, v, c] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('books').select('id', { count: 'exact', head: true }),
        supabase.from('book_downloads').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_results').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('bible_verses').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
      ]);
      setStats({ users: u.count ?? 0, books: b.count ?? 0, downloads: dl.count ?? 0, quizzes: q.count ?? 0, messages: m.count ?? 0, verses: v.count ?? 0, courses: c.count ?? 0 });
      const { data } = await supabase.from('quiz_results').select('id, score, category, created_at').order('created_at', { ascending: false }).limit(5);
      setRecent((data as { id: string; score: number; category: string; created_at: string }[]) ?? []);
    })();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'from-primary-500 to-primary-700' },
    { label: 'Books Downloaded', value: stats.downloads, icon: Download, color: 'from-gold-400 to-gold-600' },
    { label: 'Quiz Attempts', value: stats.quizzes, icon: Award, color: 'from-rose-500 to-rose-700' },
    { label: 'Messages Sent', value: stats.messages, icon: MessageSquare, color: 'from-accent-500 to-accent-700' },
    { label: 'Bible Verses', value: stats.verses, icon: BookOpen, color: 'from-emerald-500 to-emerald-700' },
    { label: 'Courses', value: stats.courses, icon: GraduationCap, color: 'from-violet-500 to-violet-700' },
  ];

  const exportCSV = () => {
    const csv = ['Label,Value', ...cards.map((c) => `${c.label},${c.value}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'grace-book-stats.csv'; a.click();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Analytics Overview</h2>
        <button onClick={exportCSV} className="btn-ghost py-2"><Download className="h-4 w-4" /> Export CSV</button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass-card p-5">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} mb-3`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary-600" /> Recent Quiz Activity</h3>
        {recent.length === 0 ? (
          <p className="text-center text-slate-500 py-4">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-semibold text-sm">{r.category}</p>
                  <p className="text-xs text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className="font-bold text-lg text-primary-600">{r.score} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CrudHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <button onClick={onAdd} className="btn-primary py-2"><Plus className="h-4 w-4" /> Add New</button>
    </div>
  );
}

function VersesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BibleVerse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ verse_text: '', reference: '', category: 'Faith', verse_date: '' });

  const load = async () => {
    const { data } = await supabase.from('bible_verses').select('*').order('created_at', { ascending: false });
    setItems((data as BibleVerse[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) {
      await supabase.from('bible_verses').update(form).eq('id', editing.id);
    } else {
      await supabase.from('bible_verses').insert({ ...form, verse_date: form.verse_date || null });
    }
    showToast(editing ? 'Verse updated' : 'Verse added', 'success');
    setShowForm(false); setEditing(null); setForm({ verse_text: '', reference: '', category: 'Faith', verse_date: '' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this verse?')) return;
    await supabase.from('bible_verses').delete().eq('id', id);
    showToast('Verse deleted', 'info');
    load();
  };

  const edit = (v: BibleVerse) => {
    setEditing(v);
    setForm({ verse_text: v.verse_text, reference: v.reference, category: v.category, verse_date: v.verse_date ?? '' });
    setShowForm(true);
  };

  return (
    <div>
      <CrudHeader title="Bible Verses" onAdd={() => { setEditing(null); setForm({ verse_text: '', reference: '', category: 'Faith', verse_date: '' }); setShowForm(true); }} />
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="space-y-2">
          {items.map((v) => (
            <div key={v.id} className="glass-card p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm italic mb-1">"{v.verse_text}"</p>
                <p className="text-gold-600 dark:text-gold-400 text-sm font-semibold">— {v.reference} · <span className="text-xs text-slate-500">{v.category}</span></p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => edit(v)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Edit2 className="h-4 w-4 text-slate-400" /></button>
                <button onClick={() => del(v.id)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 className="h-4 w-4 text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <FormModal show={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Verse' : 'Add Verse'} onSave={save}>
        <textarea value={form.verse_text} onChange={(e) => setForm({ ...form, verse_text: e.target.value })} placeholder="Verse text" className="input-field min-h-[80px]" />
        <input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Reference (e.g. John 3:16)" className="input-field" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
          {['Salvation', 'Strength', 'Comfort', 'Faith', 'Love', 'Hope'].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" value={form.verse_date} onChange={(e) => setForm({ ...form, verse_date: e.target.value })} className="input-field" />
      </FormModal>
    </div>
  );
}

function BooksTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState({ title: '', author: '', description: '', cloudinary_url: '', cover_url: '', category: 'General', file_format: 'PDF' });
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setItems((data as Book[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'cloudinary_url' | 'cover_url') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, field === 'cover_url' ? 'image' : 'raw');
      setForm((prev) => ({ ...prev, [field]: url }));
      showToast('File uploaded', 'success');
    } catch { showToast('Upload failed', 'error'); }
    setUploading(false);
  };

  const save = async () => {
    if (editing) {
      await supabase.from('books').update(form).eq('id', editing.id);
    } else {
      await supabase.from('books').insert(form);
    }
    showToast(editing ? 'Book updated' : 'Book added', 'success');
    setShowForm(false); setEditing(null);
    setForm({ title: '', author: '', description: '', cloudinary_url: '', cover_url: '', category: 'General', file_format: 'PDF' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    await supabase.from('books').delete().eq('id', id);
    showToast('Book deleted', 'info');
    load();
  };

  return (
    <div>
      <CrudHeader title="Books" onAdd={() => { setEditing(null); setForm({ title: '', author: '', description: '', cloudinary_url: '', cover_url: '', category: 'General', file_format: 'PDF' }); setShowForm(true); }} />
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((b) => (
            <div key={b.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm">{b.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(b); setForm({ title: b.title, author: b.author, description: b.description ?? '', cloudinary_url: b.cloudinary_url, cover_url: b.cover_url ?? '', category: b.category, file_format: b.file_format }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Edit2 className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => del(b.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500">by {b.author} · {b.category} · {b.file_format}</p>
            </div>
          ))}
        </div>
      )}
      <FormModal show={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Book' : 'Add Book'} onSave={save}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input-field" />
        <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author" className="input-field" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field min-h-[60px]" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
          {['Theology', 'Classic', 'Spiritual Growth', 'Devotional', 'Apologetics', 'General'].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={form.file_format} onChange={(e) => setForm({ ...form, file_format: e.target.value })} className="input-field">
          {['PDF', 'EPUB', 'MOBI', 'AZW'].map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="text-sm font-medium">Book File</label>
        <input type="file" onChange={(e) => uploadFile(e, 'cloudinary_url')} className="input-field" />
        {form.cloudinary_url && <p className="text-xs text-emerald-500">File uploaded ✓</p>}
        <label className="text-sm font-medium">Cover Image</label>
        <input type="file" accept="image/*" onChange={(e) => uploadFile(e, 'cover_url')} className="input-field" />
        {form.cover_url && <p className="text-xs text-emerald-500">Cover uploaded ✓</p>}
        {uploading && <p className="text-xs text-amber-500">Uploading...</p>}
      </FormModal>
    </div>
  );
}

function CoursesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ title: '', description: '', youtube_video_id: '', thumbnail_url: '', duration: '', instructor: '', category: 'Bible Study' });

  const load = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    setItems((data as Course[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (editing) {
      await supabase.from('courses').update(form).eq('id', editing.id);
    } else {
      await supabase.from('courses').insert(form);
    }
    showToast(editing ? 'Course updated' : 'Course added', 'success');
    setShowForm(false); setEditing(null);
    setForm({ title: '', description: '', youtube_video_id: '', thumbnail_url: '', duration: '', instructor: '', category: 'Bible Study' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    showToast('Course deleted', 'info');
    load();
  };

  return (
    <div>
      <CrudHeader title="Courses" onAdd={() => { setEditing(null); setForm({ title: '', description: '', youtube_video_id: '', thumbnail_url: '', duration: '', instructor: '', category: 'Bible Study' }); setShowForm(true); }} />
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div key={c.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-sm">{c.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(c); setForm({ title: c.title, description: c.description ?? '', youtube_video_id: c.youtube_video_id, thumbnail_url: c.thumbnail_url ?? '', duration: c.duration ?? '', instructor: c.instructor ?? '', category: c.category }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Edit2 className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              </div>
              <p className="text-xs text-slate-500">{c.category} · {c.duration}</p>
            </div>
          ))}
        </div>
      )}
      <FormModal show={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Course' : 'Add Course'} onSave={save}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input-field" />
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="input-field min-h-[60px]" />
        <input value={form.youtube_video_id} onChange={(e) => setForm({ ...form, youtube_video_id: e.target.value })} placeholder="YouTube Video ID" className="input-field" />
        <input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="Thumbnail URL" className="input-field" />
        <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration (e.g. 30 min)" className="input-field" />
        <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor name" className="input-field" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
          {['Bible Study', 'Prayer', 'Worship', 'Leadership', 'Apologetics', 'Devotional'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </FormModal>
    </div>
  );
}

function QuizzesTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [items, setItems] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuizType | null>(null);
  const [form, setForm] = useState({ question: '', options: ['', '', '', ''], correct_answer: 0, category: 'Bible', difficulty: 'Easy' });

  const load = async () => {
    const { data } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
    setItems((data as QuizType[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const payload = { ...form, options: form.options.filter((o) => o.trim()) };
    if (editing) {
      await supabase.from('quizzes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('quizzes').insert(payload);
    }
    showToast(editing ? 'Question updated' : 'Question added', 'success');
    setShowForm(false); setEditing(null);
    setForm({ question: '', options: ['', '', '', ''], correct_answer: 0, category: 'Bible', difficulty: 'Easy' });
    load();
  };

  const del = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await supabase.from('quizzes').delete().eq('id', id);
    showToast('Question deleted', 'info');
    load();
  };

  return (
    <div>
      <CrudHeader title="Quiz Questions" onAdd={() => { setEditing(null); setForm({ question: '', options: ['', '', '', ''], correct_answer: 0, category: 'Bible', difficulty: 'Easy' }); setShowForm(true); }} />
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="space-y-2">
          {items.map((q) => (
            <div key={q.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{q.question}</p>
                  <p className="text-xs text-slate-500 mt-1">{q.category} · {q.difficulty} · Answer: {q.options[q.correct_answer]}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(q); setForm({ question: q.question, options: [...q.options, '', '', '', ''].slice(0, 4), correct_answer: q.correct_answer, category: q.category, difficulty: q.difficulty }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Edit2 className="h-3.5 w-3.5 text-slate-400" /></button>
                  <button onClick={() => del(q.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2 className="h-3.5 w-3.5 text-red-400" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <FormModal show={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Question' : 'Add Question'} onSave={save}>
        <textarea value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Question" className="input-field min-h-[60px]" />
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" checked={form.correct_answer === i} onChange={() => setForm({ ...form, correct_answer: i })} className="w-4 h-4" />
            <input value={opt} onChange={(e) => { const next = [...form.options]; next[i] = e.target.value; setForm({ ...form, options: next }); }} placeholder={`Option ${i + 1}`} className="input-field" />
          </div>
        ))}
        <p className="text-xs text-slate-500">Select the radio button next to the correct answer.</p>
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
          {['Bible', 'General Knowledge', 'Science', 'History', 'Geography'].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="input-field">
          {['Easy', 'Medium', 'Hard'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </FormModal>
    </div>
  );
}

function UsersTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleAdmin = async (p: Profile) => {
    await supabase.from('profiles').update({ is_admin: !p.is_admin }).eq('id', p.id);
    showToast(`${p.username} ${p.is_admin ? 'removed from' : 'promoted to'} admin`, 'info');
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Users ({users.length})</h2>
      {loading ? <div className="skeleton h-64 rounded-xl" /> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-gold-400 flex items-center justify-center text-white font-bold overflow-hidden">
                {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{u.username ?? 'Unknown'}</p>
                <p className="text-xs text-slate-500">{u.full_name ?? 'No name'}</p>
              </div>
              {u.is_admin && <span className="px-2 py-0.5 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 text-xs font-bold">Admin</span>}
              <button onClick={() => toggleAdmin(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                {u.is_admin ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MessagesTab() {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);

  useEffect(() => {
    (async () => {
      const [p, c, s] = await Promise.all([
        supabase.from('prayer_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false }),
      ]);
      setPrayers((p.data as PrayerRequest[]) ?? []);
      setContacts((c.data as ContactMessage[]) ?? []);
      setSubscribers((s.data as NewsletterSubscriber[]) ?? []);
    })();
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Prayer Requests ({prayers.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {prayers.map((p) => (
            <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold">{p.name}</p>
              <p className="text-xs text-slate-500">{p.email}</p>
              <p className="text-sm mt-1">{p.request}</p>
            </div>
          ))}
          {prayers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No prayer requests</p>}
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Mail className="h-4 w-4 text-accent-500" /> Contact Messages ({contacts.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {contacts.map((c) => (
            <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold">{c.name}</p>
              <p className="text-xs text-slate-500">{c.email}</p>
              <p className="text-sm font-medium mt-1">{c.subject ?? 'No subject'}</p>
              <p className="text-xs mt-1">{c.message}</p>
            </div>
          ))}
          {contacts.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No messages</p>}
        </div>
      </div>
      <div className="glass-card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-500" /> Subscribers ({subscribers.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {subscribers.map((s) => (
            <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm font-medium">{s.email}</p>
              <p className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</p>
            </div>
          ))}
          {subscribers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No subscribers</p>}
        </div>
      </div>
    </div>
  );
}

function FormModal({ show, onClose, title, onSave, children }: {
  show: boolean; onClose: () => void; title: string; onSave: () => void; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">{children}</div>
            <div className="flex gap-2 mt-4">
              <button onClick={onSave} className="btn-primary flex-1">Save</button>
              <button onClick={onClose} className="btn-ghost">Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
