import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';
import { Sparkles, Heart, Mail, HelpCircle, ChevronDown, Send, HandHeart, Users, Target, Eye, Facebook, Twitter, Youtube, BookOpen, Code } from 'lucide-react';

const tabs = [
  { id: 'about', label: 'About Us', icon: Sparkles },
  { id: 'support', label: 'Support', icon: HelpCircle },
  { id: 'contact', label: 'Contact', icon: Mail },
] as const;

type TabId = (typeof tabs)[number]['id'];

const faqs = [
  { q: 'Is Grace Book free to use?', a: 'Yes! Grace Book is completely free. All Bible verses, books, courses, quizzes, and community features are available at no cost.' },
  { q: 'Do I need to create an account?', a: 'You can browse verses, books, and courses without an account. To download books, track progress, save favorites, and participate in chat, you will need to sign up for a free account.' },
  { q: 'How do I download books?', a: 'Go to the Books Library, click on any book to see details, then click the Download button. You will need a free account to track your downloads.' },
  { q: 'Can I contribute content?', a: 'We welcome contributions! Please contact us through the Contact tab if you would like to share books, courses, or other Christian content.' },
  { q: 'How does the quiz scoring work?', a: 'Easy questions are worth 10 points, Medium 20 points, and Hard 30 points. You also earn streak bonuses for consecutive correct answers.' },
  { q: 'Is my data private?', a: 'Yes. Your profile information and activity are protected. Only your username and avatar are visible to other users in the chat community.' },
];

export default function About() {
  const [tab, setTab] = useState<TabId>('about');
  const { showToast } = useToast();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 dark:from-slate-950 dark:via-primary-950 dark:to-slate-950 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-72 h-72 bg-gold-500 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-primary-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-white/90 font-medium">About Grace Book</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Our Heart & Mission</h1>
          <p className="text-white/80 max-w-2xl mx-auto">
            Connecting believers worldwide through Scripture, learning, and community.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="sticky top-16 z-30 glass border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                    tab === t.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  {tab === t.id && <motion.div layoutId="aboutTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {tab === 'about' && <AboutTab key="about" />}
            {tab === 'support' && <SupportTab key="support" />}
            {tab === 'contact' && <ContactTab key="contact" showToast={showToast} />}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

function AboutTab() {
  const team = [
    { name: 'Pastor James Matthews', role: 'Founder & Bible Teacher', bio: '20+ years of pastoral ministry with a passion for making Scripture accessible to all.' },
    { name: 'Sarah Chen', role: 'Course Director', bio: 'Develops curriculum and leads our prayer and worship course offerings.' },
    { name: 'David Kim', role: 'Community Lead', bio: 'Oversees our global chat community and ensures a safe, encouraging environment.' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="glass-card p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Our Mission</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            To equip every believer with accessible, high-quality Christian resources — Scripture, books,
            teaching, and community — so that faith may grow deeper and the body of Christ may be strengthened
            across the globe.
          </p>
        </div>
        <div className="glass-card p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 mb-4">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Our Vision</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            A world where every person, regardless of location or background, has free access to the
            life-transforming Word of God and a loving community to walk alongside them in their faith journey.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="glass-card p-6 mb-12">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" /> What We Believe
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Scripture First', desc: 'The Bible is the foundation of everything we share.' },
            { title: 'Freely Given', desc: 'All resources are free, as grace is freely received.' },
            { title: 'Community Driven', desc: 'We grow together, not alone, in our faith walk.' },
          ].map((v) => (
            <div key={v.title} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-semibold text-sm mb-1">{v.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <h2 className="text-2xl font-bold mb-6 text-center">Our Team</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {team.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-gold-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              {member.name.charAt(0)}
            </div>
            <h3 className="font-bold">{member.name}</h3>
            <p className="text-sm text-primary-600 dark:text-primary-400 mb-2">{member.role}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{member.bio}</p>
          </motion.div>
        ))}
      </div>

      {/* Social links */}
      <div className="mt-12 text-center">
        <h3 className="font-bold mb-4">Follow Us</h3>
        <div className="flex items-center justify-center gap-3">
          {[Facebook, Twitter, Youtube, Mail].map((Icon, i) => (
            <a key={i} href="#" className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-gradient-to-br hover:from-primary-600 hover:to-gold-500 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:text-white">
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>

      {/* Developer credit */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl glass-card">
          <Code className="h-4 w-4 text-primary-500" />
          <span className="text-sm text-slate-600 dark:text-slate-300">This app was developed by</span>
          <a href="https://addispower.pages.dev" target="_blank" rel="noopener noreferrer" className="text-sm font-bold gradient-text hover:opacity-80 transition-opacity">
            Addis Power
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function SupportTab() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Help Center</h2>
        <p className="text-slate-500 dark:text-slate-400">Frequently asked questions about Grace Book</p>
      </div>

      <div className="space-y-3 mb-12">
        {faqs.map((faq, i) => (
          <div key={i} className="glass-card overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-semibold text-sm">{faq.q}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ml-2 ${openFaq === i ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openFaq === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Prayer request */}
      <PrayerForm />
    </motion.div>
  );
}

function PrayerForm() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', request: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('prayer_requests').insert({
      name: form.name,
      email: form.email,
      request: form.request,
    });
    setSubmitting(false);
    if (error) {
      showToast('Could not submit request. Please try again.', 'error');
    } else {
      showToast('Your prayer request has been submitted. We are praying for you.', 'success');
      setForm({ name: '', email: '', request: '' });
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center">
          <HandHeart className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold">Submit a Prayer Request</h3>
          <p className="text-xs text-slate-500">Our team will pray over your request</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input-field" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email" className="input-field" />
        </div>
        <textarea required value={form.request} onChange={(e) => setForm({ ...form, request: e.target.value })} placeholder="Share your prayer request..." className="input-field min-h-[100px]" />
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Submitting...' : 'Submit Prayer Request'}
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ContactTab({ showToast }: { showToast: (m: string, t?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });
    setSubmitting(false);
    if (error) {
      showToast('Could not send message. Please try again.', 'error');
    } else {
      showToast('Message sent! We will get back to you soon.', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
        <p className="text-slate-500 dark:text-slate-400">We would love to hear from you</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Mail, title: 'Email Us', value: 'hello@gracebook.app' },
          { icon: Users, title: 'Community', value: 'Join our global chat' },
          { icon: BookOpen, title: 'Resources', value: '100+ books & courses' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="glass-card p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-gold-500 mb-3">
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-6">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="input-field" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Your email" className="input-field" />
          </div>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="input-field" />
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message..." className="input-field min-h-[120px]" />
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending...' : 'Send Message'}
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
