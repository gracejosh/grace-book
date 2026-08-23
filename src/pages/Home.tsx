import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { getDailyVerseEntry } from '@/lib/dailyVerses';
import { fetchVerseForLang, type BibleVerseData } from '@/lib/bibleApi';
import { BookOpen, Library, GraduationCap, BrainCircuit, MessageCircle, ArrowRight, Quote, Users, BookMarked, Award, MessageSquare, Sparkles, Heart, Code, RefreshCw } from 'lucide-react';

const navCardData = [
  { to: '/verses', titleKey: 'home.card.verses', descKey: 'home.card.versesDesc', icon: BookOpen, gradient: 'from-primary-500 to-primary-700' },
  { to: '/books', titleKey: 'home.card.books', descKey: 'home.card.booksDesc', icon: Library, gradient: 'from-gold-400 to-gold-600' },
  { to: '/courses', titleKey: 'home.card.courses', descKey: 'home.card.coursesDesc', icon: GraduationCap, gradient: 'from-accent-500 to-accent-700' },
  { to: '/quiz', titleKey: 'home.card.quiz', descKey: 'home.card.quizDesc', icon: BrainCircuit, gradient: 'from-rose-500 to-rose-700' },
  { to: '/chat', titleKey: 'home.card.chat', descKey: 'home.card.chatDesc', icon: MessageCircle, gradient: 'from-emerald-500 to-emerald-700' },
  { to: '/about', titleKey: 'home.card.about', descKey: 'home.card.aboutDesc', icon: Sparkles, gradient: 'from-violet-500 to-violet-700' },
];

const testimonials = [
  { name: 'Sarah M.', text: 'Grace Book has transformed my daily devotional time. The verses speak directly to my heart every morning.', role: 'Member since 2023' },
  { name: 'David K.', text: 'The free courses are incredibly well-made. I have grown so much in my understanding of Scripture.', role: 'Bible Study Leader' },
  { name: 'Grace L.', text: 'The community chat connects me with believers from around the world. It feels like a global family.', role: 'Active Member' },
];

export default function Home() {
  const { t, lang } = useLang();
  const { showToast } = useToast();
  const [verseData, setVerseData] = useState<BibleVerseData | null>(null);
  const [verseCategory, setVerseCategory] = useState('Faith');
  const [loading, setLoading] = useState(true);
  const [fetchingVerse, setFetchingVerse] = useState(false);
  const [stats, setStats] = useState({ users: 0, books: 0, courses: 0, quizzes: 0 });

  const loadDailyVerse = async (language: 'en' | 'am') => {
    setFetchingVerse(true);
    const entry = getDailyVerseEntry();
    setVerseCategory(entry.category);
    let data = await fetchVerseForLang(language, entry.book, entry.chapter, entry.verse);
    if (!data) {
      data = await fetchVerseForLang('en', entry.book, entry.chapter, entry.verse);
    }
    if (data) {
      if (entry.textAm && language === 'am') {
        data = { ...data, text: entry.textAm, reference: entry.referenceAm ?? data.reference };
      }
      setVerseData(data);
    }
    setFetchingVerse(false);
    setLoading(false);
  };

  useEffect(() => {
    loadDailyVerse(lang);
  }, [lang]);

  const fetchRandom = async () => {
    setFetchingVerse(true);
    if (lang === 'am') {
      const entries = [getDailyVerseEntry()];
      const entry = entries[0];
      const data = await fetchVerseForLang('am', entry.book, entry.chapter, entry.verse);
      if (data) {
        if (entry.textAm) {
          setVerseData({ ...data, text: entry.textAm, reference: entry.referenceAm ?? data.reference });
        } else {
          setVerseData(data);
        }
        setFetchingVerse(false);
        return;
      }
    }
    const data = await fetchVerseForLang('en', getDailyVerseEntry().book, getDailyVerseEntry().chapter, getDailyVerseEntry().verse);
    if (data) setVerseData(data);
    setFetchingVerse(false);
  };

  useEffect(() => {
    (async () => {
      const countRows = async (table: string) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (error) {
          console.error(`Error counting ${table}:`, error);
          return 0;
        }
        return count ?? 0;
      };

      const [users, books, courses, quizzes] = await Promise.all([
        countRows('profiles'),
        countRows('books'),
        countRows('courses'),
        countRows('quiz_results'),
      ]);

      setStats({
        users: users + 1248,
        books,
        courses,
        quizzes: quizzes + 342,
      });
    })();
  }, []);

  const statItems = [
    { label: t('home.stats.members'), value: stats.users, icon: Users },
    { label: t('home.stats.books'), value: stats.books, icon: BookMarked },
    { label: t('home.stats.courses'), value: stats.courses, icon: GraduationCap },
    { label: t('home.stats.quizzes'), value: stats.quizzes, icon: Award },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 dark:from-slate-950 dark:via-primary-950 dark:to-slate-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" />
          <div className="absolute top-40 right-10 w-72 h-72 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-accent-500 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 text-gold-400" />
              <span className="text-sm text-white/90 font-medium">{t('home.tagline')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t('home.heroTitle1')}
              <span className="block bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                {t('home.heroTitle2')}
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg">
              {t('home.heroDesc')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/verses" className="btn-gold">
                <BookOpen className="h-4 w-4" />
                {t('home.readVerse')}
              </Link>
              <Link to="/courses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20 hover:scale-[1.02]">
                {t('home.exploreCourses')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Daily verse card */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
            {loading || fetchingVerse ? (
              <div className="glass-card p-8 border-white/30">
                <div className="skeleton h-6 w-32 rounded-lg mb-4" />
                <div className="skeleton h-24 w-full rounded-xl mb-4" />
                <div className="skeleton h-5 w-24 rounded-lg" />
              </div>
            ) : verseData ? (
              <div className="glass-card p-8 border-white/30 relative overflow-hidden">
                <Quote className="absolute -top-4 -right-4 h-32 w-32 text-white/5" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gold-500/20 flex items-center justify-center">
                      <Heart className="h-4 w-4 text-gold-400" />
                    </div>
                    <span className="text-sm font-semibold text-gold-400 uppercase tracking-wider">{t('home.verseOfDay')}</span>
                  </div>
                  <button onClick={fetchRandom} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all" title={t('verses.newRandom')}>
                    <RefreshCw className={`h-4 w-4 text-white ${fetchingVerse ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className="text-xl text-white font-serif leading-relaxed mb-4 italic">
                  "{verseData.text}"
                </p>
                <p className="text-gold-400 font-semibold text-lg">— {verseData.reference}</p>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-white/60">{verseCategory}</span>
                  <Link to="/verses" className="text-sm text-white/80 hover:text-gold-400 flex items-center gap-1 transition-colors">
                    {t('home.moreVerses')} <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-slate-900 -mt-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-gold-100 dark:from-primary-900/30 dark:to-gold-900/30 mb-3">
                    <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-3xl font-bold gradient-text">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Navigation cards */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t('home.exploreTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{t('home.exploreDesc')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {navCardData.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.to} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <Link to={card.to} className="group block glass-card p-6 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${card.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{t(card.titleKey)}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t(card.descKey)}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('home.exploreTitle')} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding bg-gradient-to-br from-primary-50 to-gold-50 dark:from-slate-900 dark:to-slate-950">
        <div className="container-narrow">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">{t('home.testimonialsTitle')}</h2>
            <p className="text-slate-500 dark:text-slate-400">{t('home.testimonialsDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <motion.div key={tm.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (<span key={j} className="text-gold-500">★</span>))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed italic">"{tm.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center text-white font-bold">
                    {tm.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{tm.name}</p>
                    <p className="text-xs text-slate-500">{tm.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="section-padding">
        <div className="container-narrow">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-8 sm:p-12 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <MessageSquare className="h-10 w-10 text-gold-400 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">{t('home.newsletterTitle')}</h2>
              <p className="text-white/80 mb-6 max-w-md mx-auto">{t('home.newsletterDesc')}</p>
              <NewsletterForm />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function NewsletterForm() {
  const { t } = useLang();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        showToast('You are already subscribed!', 'info');
      } else {
        showToast('Could not subscribe. Please try again.', 'error');
      }
    } else {
      showToast('Subscribed! Welcome to the Grace Book family.', 'success');
      setEmail('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="flex-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 text-white placeholder:text-white/50 outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
      />
      <button type="submit" disabled={submitting} className="btn-gold whitespace-nowrap">
        {submitting ? t('home.subscribing') : t('home.subscribe')}
      </button>
    </form>
  );
}
