import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Course, CourseProgress } from '@/types';
import { Search, Play, X, CheckCircle, Clock, User, GraduationCap, Award, BookOpen, AlertCircle } from 'lucide-react';
import { SkeletonCard, EmptyState } from '@/components/ui';

const categories = ['All', 'Bible Study', 'Prayer', 'Worship', 'Leadership', 'Apologetics', 'Devotional'];

export default function Courses() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('🎓 Fetching courses from Supabase...');
        
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching courses:', error);
          setError(error.message);
          showToast('Could not load courses: ' + error.message, 'error');
          setLoading(false);
          return;
        }

        console.log('✅ Courses fetched successfully:', data?.length, 'courses found');
        console.log('📊 First course sample:', data?.[0]);
        
        setCourses((data as Course[]) ?? []);
      } catch (err) {
        console.error('💥 Unexpected error fetching courses:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        showToast('Unexpected error loading courses', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch user's course progress
  useEffect(() => {
    if (!user) return;
    
    const fetchProgress = async () => {
      try {
        console.log('📊 Fetching course progress for user:', user.id);
        const { data, error } = await supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('❌ Error fetching progress:', error);
          return;
        }
        
        console.log('✅ Course progress fetched:', data?.length, 'records');
        const map: Record<string, CourseProgress> = {};
        (data ?? []).forEach((p: CourseProgress) => { 
          map[p.course_id] = p; 
        });
        setProgress(map);
      } catch (err) {
        console.error('💥 Error in progress fetch:', err);
      }
    };
    
    fetchProgress();
  }, [user]);

  const filtered = useMemo(() => {
    console.log('🔍 Filtering courses - search:', search, 'category:', category);
    
    const result = courses.filter((c) => {
      const matchesCategory = category === 'All' || c.category === category;
      const q = search.toLowerCase();
      const matchesSearch = !search || 
        c.title?.toLowerCase().includes(q) || 
        (c.instructor?.toLowerCase().includes(q) ?? false);
      return matchesCategory && matchesSearch;
    });
    
    console.log('🎓 Filtered courses:', result.length);
    return result;
  }, [courses, search, category]);

  const markComplete = async (course: Course) => {
    if (!user) {
      showToast('Please sign in to track progress', 'info');
      return;
    }
    
    try {
      console.log('✅ Marking course complete:', course.title);
      
      const existing = progress[course.id];
      if (existing) {
        const { error } = await supabase
          .from('course_progress')
          .update({ progress_percentage: 100, is_completed: true })
          .eq('id', existing.id);
          
        if (error) {
          console.error('❌ Error updating progress:', error);
          showToast('Could not update progress', 'error');
          return;
        }
      } else {
        const { error } = await supabase
          .from('course_progress')
          .insert({ 
            user_id: user.id, 
            course_id: course.id, 
            progress_percentage: 100, 
            is_completed: true 
          });
          
        if (error) {
          console.error('❌ Error inserting progress:', error);
          showToast('Could not save progress', 'error');
          return;
        }
      }
      
      setProgress((prev) => ({
        ...prev,
        [course.id]: { 
          id: existing?.id ?? '', 
          user_id: user.id, 
          course_id: course.id, 
          progress_percentage: 100, 
          is_completed: true, 
          updated_at: new Date().toISOString() 
        },
      }));
      
      showToast('Course marked as complete!', 'success');
    } catch (err) {
      console.error('💥 Error marking course complete:', err);
      showToast('Could not mark course as complete', 'error');
    }
  };

  const completedCount = Object.values(progress).filter((p) => p.is_completed).length;

  // Error state
  if (error && !loading && courses.length === 0) {
    return (
      <div className="min-h-screen">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 to-slate-900 dark:from-slate-950 dark:to-primary-950 py-16">
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <GraduationCap className="h-4 w-4 text-gold-400" />
              <span className="text-sm text-white/90 font-medium">Free Video Courses</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Grow in Your Faith</h1>
            <p className="text-white/80 max-w-2xl mx-auto">Learn from experienced teachers.</p>
          </div>
        </section>
        
        <section className="section-padding">
          <div className="container-narrow">
            <div className="glass-card p-8 text-center max-w-md mx-auto">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Failed to Load Courses</h2>
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
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent-500 rounded-full blur-3xl animate-float" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <GraduationCap className="h-4 w-4 text-gold-400" />
            <span className="text-sm text-white/90 font-medium">Free Video Courses</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Grow in Your Faith</h1>
          <p className="text-white/80 max-w-2xl mx-auto">Learn from experienced teachers through our free video courses. Track your progress and earn certificates.</p>
          {user && completedCount > 0 && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/20 border border-gold-500/30">
              <Award className="h-5 w-5 text-gold-400" />
              <span className="text-white font-medium">
                {completedCount} course{completedCount !== 1 ? 's' : ''} completed
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">All Courses</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{filtered.length} courses available</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search courses..." 
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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary-500" />}
              title={courses.length === 0 ? "No Courses Available" : "No Courses Found"}
              description={
                courses.length === 0 
                  ? "Check back soon! We're adding new courses." 
                  : "Try a different search term or category filter."
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course, i) => {
                const prog = progress[course.id];
                const isCompleted = prog?.is_completed;
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.06, 0.5) }}
                    className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <button 
                      onClick={() => setSelectedCourse(course)} 
                      className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-gold-100 dark:from-slate-800 dark:to-slate-700"
                    >
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            console.warn('⚠️ Failed to load thumbnail for:', course.title);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <GraduationCap className="h-16 w-16 text-primary-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-6 w-6 text-primary-600 ml-1" fill="currentColor" />
                        </div>
                      </div>
                      {isCompleted && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {course.duration || 'Video Course'}
                      </div>
                    </button>
                    <div className="p-5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-2 inline-block">
                        {course.category || 'General'}
                      </span>
                      <h3 className="text-lg font-bold mb-1 line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {course.instructor || 'Unknown Instructor'}
                      </p>
                      {prog && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 dark:text-slate-400">Progress</span>
                            <span className="font-semibold">{prog.progress_percentage || 0}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary-500 to-gold-500 rounded-full transition-all duration-500" 
                              style={{ width: `${prog.progress_percentage || 0}%` }} 
                            />
                          </div>
                        </div>
                      )}
                      <button 
                        onClick={() => setSelectedCourse(course)} 
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold hover:scale-[1.02] transition-transform"
                      >
                        {isCompleted ? 'Review Course' : prog ? 'Continue Watching' : 'Start Course'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Course video modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCourse(null)}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-3xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                    {selectedCourse.category || 'General'}
                  </span>
                  <h2 className="text-xl font-bold mt-1">{selectedCourse.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCourse(null)} 
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {selectedCourse.youtube_video_id ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedCourse.youtube_video_id}`}
                    title={selectedCourse.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <div className="text-center text-white">
                    <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold">Video Coming Soon</p>
                    <p className="text-sm opacity-70">This course video is not yet available</p>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {selectedCourse.duration || 'Self-paced'}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" /> {selectedCourse.instructor || 'Unknown Instructor'}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                  {selectedCourse.description || 'No description available for this course.'}
                </p>
                <button onClick={() => markComplete(selectedCourse)} className="btn-gold w-full">
                  <CheckCircle className="h-4 w-4" />
                  {progress[selectedCourse.id]?.is_completed ? 'Completed' : 'Mark as Complete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
