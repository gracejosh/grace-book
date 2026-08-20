import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Quiz as QuizType, QuizResult } from '@/types';
import { BrainCircuit, Clock, Flame, Trophy, CheckCircle, XCircle, RotateCcw, Award, Share2, ChevronRight, Star, BookOpen, Globe, Atom, Scroll, Map } from 'lucide-react';
import { SkeletonCard, EmptyState } from '@/components/ui';

const categories = ['Bible', 'General Knowledge', 'Science', 'History', 'Geography'];
const difficultyPoints = { Easy: 10, Medium: 20, Hard: 30 } as Record<string, number>;
const QUESTION_TIME = 30;

type Phase = 'select' | 'playing' | 'results';

export default function Quiz() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>('select');
  const [questions, setQuestions] = useState<QuizType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Bible');
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startQuiz = async (category: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('quizzes').select('*').eq('category', category).order('random()').limit(10);
    if (error || !data || data.length === 0) {
      showToast('No questions available for this category yet', 'error');
      setLoading(false);
      return;
    }
    setQuestions(data as QuizType[]);
    setSelectedCategory(category);
    setCurrentQ(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setTimeLeft(QUESTION_TIME);
    setStartTime(Date.now());
    setPhase('playing');
    setLoading(false);
  };

  const handleAnswer = useCallback((idx: number) => {
    if (answered) return;
    setSelectedAnswer(idx);
    setAnswered(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const correct = idx === questions[currentQ].correct_answer;
    if (correct) {
      const points = difficultyPoints[questions[currentQ].difficulty] ?? 10;
      const streakBonus = Math.floor(streak * 2);
      setScore((prev) => prev + points + streakBonus);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((m) => Math.max(m, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }, [answered, questions, currentQ, streak]);

  const nextQuestion = useCallback(() => {
    if (currentQ + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setTimeLeft(QUESTION_TIME);
    }
  }, [currentQ, questions.length]);

  const finishQuiz = useCallback(async () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    if (user) {
      await supabase.from('quiz_results').insert({
        user_id: user.id,
        score,
        total_questions: questions.length,
        category: selectedCategory,
        time_taken: timeTaken,
      });
    }
    setPhase('results');
    loadLeaderboard();
  }, [user, score, questions.length, selectedCategory, startTime]);

  const loadLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('quiz_results')
      .select('score, total_questions, category, time_taken, created_at, user_id')
      .order('score', { ascending: false })
      .limit(10);
    setResults((data as QuizResult[]) ?? []);
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setAnswered(true);
          setStreak(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, answered, currentQ]);

  // Auto-advance after answering
  useEffect(() => {
    if (phase === 'playing' && answered) {
      const timeout = setTimeout(() => nextQuestion(), 2000);
      return () => clearTimeout(timeout);
    }
  }, [answered, phase, nextQuestion]);

  const progressPct = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const timePct = (timeLeft / QUESTION_TIME) * 100;

  if (phase === 'select') {
    return <CategorySelect categories={categories} onSelect={startQuiz} loading={loading} />;
  }

  if (phase === 'results') {
    return (
      <ResultsScreen
        score={score}
        total={questions.length}
        maxStreak={maxStreak}
        category={selectedCategory}
        results={results}
        user={user}
        onRetry={() => startQuiz(selectedCategory)}
        onChangeCategory={() => setPhase('select')}
      />
    );
  }

  // Playing
  const q = questions[currentQ];
  return (
    <div className="min-h-screen pt-8 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <Star className="h-5 w-5 text-gold-500" />
            <span className="font-bold text-lg">{score}</span>
            <span className="text-xs text-slate-500">pts</span>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streak >= 3 ? 'text-orange-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-bold text-lg">{streak}</span>
            <span className="text-xs text-slate-500">streak</span>
          </div>
          <div className="glass-card px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-slate-500">Q</span>
            <span className="font-bold text-lg">{currentQ + 1}/{questions.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-6">
          <motion.div className="h-full bg-gradient-to-r from-primary-500 to-gold-500" animate={{ width: `${progressPct}%` }} transition={{ duration: 0.3 }} />
        </div>

        {/* Timer */}
        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-5 w-5 text-slate-400" />
          <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${timeLeft > 10 ? 'bg-emerald-500' : timeLeft > 5 ? 'bg-amber-500' : 'bg-red-500'}`}
              animate={{ width: `${timePct}%` }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </div>
          <span className={`font-bold text-lg w-8 text-center ${timeLeft <= 5 ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>{timeLeft}</span>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="glass-card p-6 sm:p-8 mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{q.category}</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold-100 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300">{q.difficulty} · {difficultyPoints[q.difficulty] ?? 10}pts</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-6">{q.question}</h2>
            <div className="grid gap-3">
              {q.options.map((option, idx) => {
                const isCorrect = idx === q.correct_answer;
                const isSelected = idx === selectedAnswer;
                let className = 'border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:scale-[1.01]';
                if (answered) {
                  if (isCorrect) className = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
                  else if (isSelected) className = 'border-red-500 bg-red-50 dark:bg-red-900/20';
                  else className = 'border-slate-200 dark:border-slate-700 opacity-50';
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 text-left font-medium transition-all duration-200 ${className}`}
                  >
                    <span>{option}</span>
                    {answered && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    {answered && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {answered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {selectedAnswer === q.correct_answer ? 'Correct! ' : 'Time\'s up or wrong answer. '}
              Next question in a moment...
            </p>
            <button onClick={nextQuestion} className="btn-primary mt-4">
              {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CategorySelect({ categories, onSelect, loading }: { categories: string[]; onSelect: (c: string) => void; loading: boolean }) {
  const icons: Record<string, typeof BrainCircuit> = {
    Bible: BookOpen,
    'General Knowledge': Globe,
    Science: Atom,
    History: Scroll,
    Geography: Map,
  };

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-slate-900 dark:from-slate-950 dark:to-primary-950 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-20 w-72 h-72 bg-rose-500 rounded-full blur-3xl animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <BrainCircuit className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-white/90 font-medium">Test Your Knowledge</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Quiz Challenge</h1>
          <p className="text-white/80 max-w-2xl mx-auto">Choose a category, answer 10 questions, earn points and build your streak!</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Choose a Category</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center mb-10">Easy = 10pts · Medium = 20pts · Hard = 30pts · Streak bonus!</p>
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat, i) => {
                const Icon = icons[cat] ?? BrainCircuit;
                return (
                  <motion.button
                    key={cat}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => onSelect(cat)}
                    className="glass-card p-6 text-center group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-gold-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-1">{cat}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">10 questions · 30s each</p>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ResultsScreen({ score, total, maxStreak, category, results, user, onRetry, onChangeCategory }: {
  score: number; total: number; maxStreak: number; category: string; results: QuizResult[];
  user: { id: string } | null; onRetry: () => void; onChangeCategory: () => void;
}) {
  const { showToast } = useToast();
  const accuracy = total > 0 ? Math.round((score / (total * 30)) * 100) : 0;
  const isGoodScore = score >= total * 15;

  const shareScore = () => {
    const text = `I just scored ${score} points in the ${category} quiz on Grace Book! Can you beat me?`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      showToast('Score copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen pt-8 pb-20">
      {/* Confetti */}
      {isGoodScore && <Confetti />}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 mb-4 shadow-lg shadow-gold-500/30">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{category}</p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-6xl font-bold gradient-text mb-2"
          >
            {score}
          </motion.div>
          <p className="text-slate-500 dark:text-slate-400 mb-6">points out of {total * 30} max</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass p-4 rounded-xl">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-slate-500">Questions</p>
            </div>
            <div className="glass p-4 rounded-xl">
              <p className="text-2xl font-bold text-orange-500">{maxStreak}</p>
              <p className="text-xs text-slate-500">Max Streak</p>
            </div>
            <div className="glass p-4 rounded-xl">
              <p className="text-2xl font-bold text-emerald-500">{accuracy}%</p>
              <p className="text-xs text-slate-500">Score Rate</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onRetry} className="btn-primary flex-1">
              <RotateCcw className="h-4 w-4" /> Retry Quiz
            </button>
            <button onClick={onChangeCategory} className="btn-ghost flex-1">
              Change Category
            </button>
            <button onClick={shareScore} className="btn-gold">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {!user && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-4">
              Sign in to save your scores and appear on the leaderboard!
            </p>
          )}
        </motion.div>

        {/* Leaderboard */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-gold-500" />
            <h2 className="text-xl font-bold">Leaderboard</h2>
          </div>
          {results.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No scores yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    i === 0 ? 'bg-gold-50 dark:bg-gold-900/20 border border-gold-300 dark:border-gold-700' : 'bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    i === 0 ? 'bg-gold-500 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {r.user_id === user?.id ? 'You' : `Player ${r.user_id.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-slate-500">{r.category} · {r.total_questions} questions</p>
                  </div>
                  <span className="font-bold text-lg text-primary-600 dark:text-primary-400">{r.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 50 });
  const colors = ['#fbbf24', '#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ top: '-10%', left: `${Math.random() * 100}%`, rotate: 0, opacity: 1 }}
          animate={{ top: '110%', rotate: Math.random() * 720, opacity: 0 }}
          transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

