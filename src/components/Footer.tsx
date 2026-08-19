import { Link } from 'react-router-dom';
import { BookOpen, Facebook, Twitter, Youtube, Mail, Heart, Code } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

export default function Footer() {
  const { t } = useLang();

  const exploreLinks = [
    { to: '/verses', label: t('footer.bibleVerses') },
    { to: '/books', label: t('footer.booksLibrary') },
    { to: '/courses', label: t('footer.freeCourses') },
    { to: '/quiz', label: t('footer.quizChallenge') },
    { to: '/chat', label: t('footer.communityChat') },
  ];

  const connectLinks = [
    { to: '/about', label: t('footer.aboutUs') },
    { to: '/about', label: t('footer.support') },
    { to: '/about', label: t('footer.contactUs') },
    { to: '/about', label: t('footer.prayerRequests') },
  ];

  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-gold-500 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Grace Book</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Facebook, Twitter, Youtube, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-primary-600 flex items-center justify-center transition-all duration-300 hover:scale-110"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.explore')}</h4>
            <ul className="space-y-2 text-sm">
              {exploreLinks.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="hover:text-gold-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">{t('footer.connect')}</h4>
            <ul className="space-y-2 text-sm">
              {connectLinks.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="hover:text-gold-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Grace Book. {t('footer.rights')}
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            {t('footer.madeWith')} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t('footer.forKingdom')}
          </p>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          <a
            href="https://addispower.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gold-400 transition-colors group"
          >
            <Code className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            {t('footer.developedBy')}
          </a>
          <span className="hidden sm:inline text-slate-600">·</span>
          <a
            href="https://addispower.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-gold-400 transition-colors"
          >
            Powered by Addis Power
          </a>
        </div>
      </div>
    </footer>
  );
}
