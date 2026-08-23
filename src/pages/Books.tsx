import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Book } from '@/types';
import { Search, Download, BookOpen, X, Star, FileText, Eye, Library as LibraryIcon, TrendingUp, ArrowDownAZ, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  // Fetch books
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📚 Fetching books from Supabase...');
        
        const { data, error } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching books:', error);
          setError(error.message);
          showToast('Could not load books: ' + error.message, 'error');
          setLoading(false);
          return;
        }

        console.log('✅ Books fetched successfully:', data?.length, 'books found');
        console.log('📊 First book sample:', data?.[0]);
        
        setBooks((data as Book[]) ?? []);
      } catch (err) {
        console.error('💥 Unexpected error fetching books:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        showToast('Unexpected error loading books', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's downloaded books
  useEffect(() => {
    if (!user) return;
    
    const fetchDownloads = async () => {
      try {
        console.log('📥 Fetching user downloads...');
        const { data, error } = await supabase
          .from('book_downloads')
          .select('book_id')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('❌ Error fetching downloads:', error);
          return;
        }
        
        console.log('✅ Downloads fetched:', data?.length, 'downloads');
        setDownloaded(new Set((data ?? []).map((d: { book_id: string }) => d.book_id)));
      } catch (err) {
        console.error('💥 Error in downloads fetch:', err);
      }
    };
    
    fetchDownloads();
  }, [user]);

  const filtered = useMemo(() => {
    console.log('🔍 Filtering books - search:', search, 'category:', category, 'sortBy:', sortBy);
    
    let result = books.filter((b) => {
      const matchesCategory = category === 'All' || b.category === category;
      const q = search.toLowerCase();
      const matchesSearch = !search || 
        b.title?.toLowerCase().includes(q) || 
        b.author?.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
    
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.downloads_count || 0) - (a.downloads_count || 0));
    } else if (sortBy === 'alphabetical') {
      result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    
    console.log('📚 Filtered books:', result.length);
    return result;
  }, [books, search, category, sortBy]);

  const handleDownload = useCallback(async (book: Book) => {
    if (!user) {
      showToast('Please sign in to download books', 'info');
      return;
    }
    
    try {
      console.log('⬇️ Downloading book:', book.title);
      
      const { error: dlError } = await supabase
        .from('book_downloads')
        .upsert({ user_id: user.id, book_id: book.id }, { onConflict: 'user_id,book_id' });
        
      if (!dlError) {
        await supabase
          .from('books')
          .update({ downloads_count: (book.downloads_count || 0) + 1 })
          .eq('id', book.id);
          
        setDownloaded((prev) => new Set(prev).add(book.id));
        setBooks((prev) => prev.map((b) => 
          b.id === book.id ? { ...b, downloads_count: (b.downloads_count || 0) + 1 } : b
        ));
      }
      
      if (book.cloudinary_url) {
        window.open(book.cloudinary_url, '_blank');
      } else {
        console.warn('⚠️ No cloudinary_url for book:', book);
        showToast('Download link not available', 'warning');
      }
      
      showToast('Download started!', 'success');
    } catch (err) {
      console.error('💥 Error downloading book:', err);
      showToast('Download failed', 'error');
    }
  }, [user, showToast]);

  // Error state
  if (error && !loading && books.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-slate-900 dark:from-slate-950 dark:to-primary-950 py-16">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <LibraryIcon className="h-4 w-4 text-gold-400" />
              <span className="text-sm text-white/90 font-medium">Free Christian Books</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Books Library</h1>
            <p className="text-white/80 max-w-2xl mx-auto">Download timeless Christian literature.</p>
          </div>
        </section>
        
        <section className="section-padding">
          <div className="container-narrow">
            <div className="glass-card p-8 text-center max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Failed to Load Books</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search books..." 
                className="input-field pl-10" 
              />
            </div>
            <div className="flex gap-2">
              {sortOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      sortBy === opt.value 
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg' 
                        : 'glass text-slate-600 dark:text-slate-300 hover:scale-105'
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
                  category === cat 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/25' 
                    : 'glass text-slate-600 dark:text-slate-300 hover:scale-105'
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
              title={books.length === 0 ? "No Books Available" : "No Books Found"}
              description={
                books.length === 0 
                  ? "Check back soon! We're adding new books to our library." 
                  : "Try a different search term or category filter."
              }
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
                      <img 
                        src={book.cover_url} 
                        alt={book.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          console.warn('⚠️ Failed to load cover image for:', book.title);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-16 w-16 text-primary-300" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                      {book.file_format || 'PDF'}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-2 inline-block">
                      {book.category || 'General'}
                    </span>
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">{book.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">by {book.author}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <Download className="h-4 w-4" />
                        {(book.downloads_count || 0).toLocaleString()}
                      </span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => setSelectedBook(book)} 
                          className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                        <button 
                          onClick={() => handleDownload(book)} 
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white text-xs font-semibold hover:scale-105 transition-transform"
                        >
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
                <button 
                  onClick={() => setSelectedBook(null)} 
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 backdrop-blur-md text-white hover:bg-black/60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {selectedBook.category || 'General'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">
                    {selectedBook.file_format || 'PDF'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{selectedBook.title}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-4">by {selectedBook.author}</p>
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Download className="h-4 w-4" /> {(selectedBook.downloads_count || 0).toLocaleString()} downloads
                  </span>
                  <span className="flex items-center gap-1 text-gold-500">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />
                    ))}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                  {selectedBook.description || 'No description available.'}
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleDownload(selectedBook)} className="btn-primary flex-1">
                    <Download className="h-4 w-4" />
                    Download {selectedBook.file_format || 'PDF'}
                  </button>
                  {selectedBook.file_format === 'PDF' && selectedBook.cloudinary_url && (
                    <a 
                      href={selectedBook.cloudinary_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn-ghost"
                    >
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
