import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Book } from '@/types';
import { Search, Download, BookOpen, X, Star, FileText, Eye, Library as LibraryIcon, TrendingUp, ArrowDownAZ } from 'lucide-react';
import { SkeletonCard, EmptyState } from '@/components/ui';

const categories = ['All', 'Theology', 'Classic', 'Spiritual Growth', 'Devotional', 'Apologetics', 'General'];
const sortOptions = [
  { value: 'newest', label: 'Newest', icon: TrendingUp },
  { value: 'popular', label: 'Most Popular', icon: Star },
  { value: 'alphabetical', label: 'A-Z', icon: ArrowDownAZ },
];

export default function Books() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (error) {
        showToast('Could not load books', 'error');
        setLoading(false);
        return;
      }
      setBooks((data as Book[]) ?? []);
      setLoading(false);
    })();
  }, [showToast]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('book_downloads').select('book_id').eq('user_id', user.id);
      setDownloaded(new Set((data ?? []).map((d: { book_id: string }) => d.book_id)));
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let result = books.filter((b) => {
      const matchesCategory = category === 'All' || b.category === category;
      const q = search.toLowerCase();
      const matchesSearch = !search || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
    if (sortBy === 'popular') result = [...result].sort((a, b) => b.downloads_count - a.downloads_count);
    else if (sortBy === 'alphabetical') result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [books, search, category, sortBy]);

  const handleDownload = useCallback(async (book: Book) => {
    if (!user) {
      showToast('Please sign in to download books', 'info');
      return;
    }
    const { error: dlError } = await supabase.from('book_downloads').upsert({ user_id: user.id, book_id: book.id }, { onConflict: 'user_id,book_id' });
    if (!dlError) {
      await supabase.from('books').update({ downloads_count: book.downloads_count + 1 }).eq('id', book.id);
      setDownloaded((prev) => new Set(prev).add(book.id));
      setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, downloads_count: b.downloads_count + 1 } : b));
    }
    window.open(book.cloudinary_url, '_blank');
    showToast('Download started!', 'success');
  }, [user, showToast]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-slate-900 dark:from-slate-950 dark:to-primary-950 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-72 h-72 bg-gold-500 rounded-full blur-3xl animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <LibraryIcon className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-white/90 font-medium">Free Christian Books</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Books Library</h1>
          <p className="text-white/80 max-w-2xl mx-auto">Download timeless Christian literature. PDF, EPUB, MOBI and more — all free.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-8">
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search books..." className="input-field pl-10" />
            </div>
            <div className="flex gap-2">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      sortBy === opt.value ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg' : 'glass text-slate-600 dark:text-slate-300 hover:scale-105'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  category === cat ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25' : 'glass text-slate-600 dark:text-slate-300 hover:scale-105'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary-500" />}
              title="No Books Found"
              description="Try a different search term or category filter."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((book, i) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.06, 0.5) }}
                  className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-primary-100 to-gold-100 dark:from-slate-800 dark:to-slate-700">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-16 w-16 text-primary-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                      {book.file_format}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-2 inline-block">
                      {book.category}
                    </span>
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">by {book.author}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Download className="h-4 w-4" />
                        {book.downloads_count.toLocaleString()}
                      </span>
                      <div className="flex gap-1.5">
                        <button onClick={() => setSelectedBook(book)} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                          <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button onClick={() => handleDownload(book)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-semibold hover:scale-105 transition-transform">
                          <Download className="h-4 w-4" />
                          Get
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Book detail modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBook(null)}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-primary-100 to-gold-100 dark:from-slate-800 dark:to-slate-700">
                {selectedBook.cover_url ? (
                  <img src={selectedBook.cover_url} alt={selectedBook.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-20 w-20 text-primary-300" />
                  </div>
                )}
                <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{selectedBook.category}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">{selectedBook.file_format}</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{selectedBook.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-4">by {selectedBook.author}</p>
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Download className="h-4 w-4" /> {selectedBook.downloads_count.toLocaleString()} downloads
                  </span>
                  <span className="flex items-center gap-1 text-gold-500">
                    {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">{selectedBook.description}</p>
                <div className="flex gap-3">
                  <button onClick={() => handleDownload(selectedBook)} className="btn-primary flex-1">
                    <Download className="h-4 w-4" />
                    Download {selectedBook.file_format}
                  </button>
                  {selectedBook.file_format === 'PDF' && (
                    <a href={selectedBook.cloudinary_url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      <FileText className="h-4 w-4" />
                      Preview
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
