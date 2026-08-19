import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { BibleVerse } from '@/types';
import { Heart, Share2, Copy, Search, BookOpen, Facebook, Twitter, MessageCircle, Mail, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonList, EmptyState } from '@/components/ui';

const categories = ['All', 'Salvation', 'Strength', 'Comfort', 'Faith', 'Love', 'Hope'];

export default function Verses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [dailyIndex, setDailyIndex] = useState(0);
  const [shareVerse, setShareVerse] = useState<BibleVerse | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('bible_verses').select('*').order('verse_date', { ascending: false, nullsFirst: false });
      if (error) {
        showToast('Could not load verses', 'error');
        setLoading(false);
        return;
      }
      setVerses((data as BibleVerse[]) ?? []);
      setLoading(false);
    })();
  }, [showToast]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('favorite_verses').select('verse_id').eq('user_id', user.id);
      setFavorites(new Set((data ?? []).map((f: { verse_id: string }) => f.verse_id)));
    })();
  }, [user]);

  const filtered = useMemo(() => {
    return verses.filter((v) => {
      const matchesCategory = category === 'All' || v.category === category;
      const q = search.toLowerCase();
      const matchesSearch = !search || v.verse_text.toLowerCase().includes(q) || v.reference.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [verses, search, category]);

  const dailyVerses = useMemo(() => verses.slice(0, 5), [verses]);
  const dailyVerse = dailyVerses[dailyIndex];

  useEffect(() => {
    if (dailyVerses.length === 0) return;
    const interval = setInterval(() => {
      setDailyIndex((prev) => (prev + 1) % dailyVerses.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [dailyVerses.length]);

  const toggleFavorite = useCallback(async (verse: BibleVerse) => {
    if (!user) {
      showToast('Please sign in to save verses', 'info');
      return;
    }
    const isFav = favorites.has(verse.id);
    if (isFav) {
      await supabase.from('favorite_verses').delete().eq('user_id', user.id).eq('verse_id', verse.id);
      setFavorites((prev) => { const next = new Set(prev); next.delete(verse.id); return next; });
      showToast('Removed from favorites', 'info');
    } else {
      await supabase.from('favorite_verses').insert({ user_id: user.id, verse_id: verse.id });
      setFavorites((prev) => new Set(prev).add(verse.id));
      showToast('Added to favorites!', 'success');
    }
  }, [user, favorites, showToast]);

  const copyVerse = async (verse: BibleVerse) => {
    const text = `"${verse.verse_text}" — ${verse.reference}`;
    await navigator.clipboard.writeText(text);
    showToast('Verse copied to clipboard', 'success');
  };

  const shareUrl = (verse: BibleVerse) => encodeURIComponent(`"${verse.verse_text}" — ${verse.reference} via Grace Book`);
  const shareText = (verse: BibleVerse) => encodeURIComponent(`"${verse.verse_text}" — ${verse.reference}`);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 dark:from-slate-950 dark:via-primary-950 dark:to-slate-950 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-64 h-64 bg-gold-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-64 h-64 bg-primary-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <BookOpen className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-white/90 font-medium">Daily Verse · Auto-rotating</span>
          </div>

          {loading ? (
            <div className="glass-card p-8 border-white/20">
              <div className="skeleton h-32 w-full rounded-xl" />
            </div>
          ) : dailyVerse ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={dailyVerse.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 sm:p-10 border-white/20 relative"
              >
                <p className="text-2xl sm:text-3xl text-white font-serif leading-relaxed italic mb-6">
                  "{dailyVerse.verse_text}"
                </p>
                <p className="text-gold-400 text-xl font-semibold">— {dailyVerse.reference}</p>
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button onClick={() => toggleFavorite(dailyVerse)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                    <Heart className={`h-5 w-5 transition-all ${favorites.has(dailyVerse.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-white'}`} />
                  </button>
                  <button onClick={() => copyVerse(dailyVerse)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                    <Copy className="h-5 w-5 text-white" />
                  </button>
                  <button onClick={() => setShareVerse(dailyVerse)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                    <Share2 className="h-5 w-5 text-white" />
                  </button>
                </div>
                {dailyVerses.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button onClick={() => setDailyIndex((prev) => (prev - 1 + dailyVerses.length) % dailyVerses.length)} className="text-white/60 hover:text-white">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex gap-1.5">
                      {dailyVerses.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === dailyIndex ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/30'}`} />
                      ))}
                    </div>
                    <button onClick={() => setDailyIndex((prev) => (prev + 1) % dailyVerses.length)} className="text-white/60 hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Verse Library</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Search and filter through our collection</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search verses..."
                className="input-field pl-10"
              />
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
            <div className="grid md:grid-cols-2 gap-4">
              <SkeletonList count={6} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary-500" />}
              title="No Verses Found"
              description="Try a different search term or category filter."
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((verse, i) => (
                <motion.div
                  key={verse.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                  className="glass-card p-6 group hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      {verse.category}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => toggleFavorite(verse)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <Heart className={`h-4 w-4 transition-all ${favorites.has(verse.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400'}`} />
                      </button>
                      <button onClick={() => copyVerse(verse)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <Copy className="h-4 w-4 text-slate-400" />
                      </button>
                      <button onClick={() => setShareVerse(verse)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <Share2 className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-serif italic text-slate-800 dark:text-slate-100 leading-relaxed mb-3">
                    "{verse.verse_text}"
                  </p>
                  <p className="text-gold-600 dark:text-gold-400 font-semibold">— {verse.reference}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {shareVerse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShareVerse(null)}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Share This Verse</h3>
                <button onClick={() => setShareVerse(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 italic">"{shareVerse.verse_text}" — {shareVerse.reference}</p>
              <div className="grid grid-cols-2 gap-3">
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl(shareVerse)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-blue-600 text-white font-medium hover:scale-105 transition-transform">
                  <Facebook className="h-5 w-5" /> Facebook
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${shareText(shareVerse)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-sky-500 text-white font-medium hover:scale-105 transition-transform">
                  <Twitter className="h-5 w-5" /> Twitter
                </a>
                <a href={`https://wa.me/?text=${shareText(shareVerse)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-xl bg-green-500 text-white font-medium hover:scale-105 transition-transform">
                  <MessageCircle className="h-5 w-5" /> WhatsApp
                </a>
                <a href={`mailto:?subject=A Bible Verse for You&body=${shareText(shareVerse)}`} className="flex items-center gap-2 p-3 rounded-xl bg-slate-600 text-white font-medium hover:scale-105 transition-transform">
                  <Mail className="h-5 w-5" /> Email
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
