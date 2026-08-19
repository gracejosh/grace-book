import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Language = 'en' | 'am';

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const translations: Record<string, { en: string; am: string }> = {
  // Navigation
  'nav.home': { en: 'Home', am: 'ቤት' },
  'nav.verses': { en: 'Verses', am: 'የመጽሐፍ ቅዱስ ጥቅሶች' },
  'nav.books': { en: 'Books', am: 'መጻሕፍት' },
  'nav.courses': { en: 'Courses', am: 'ኮርሶች' },
  'nav.quiz': { en: 'Quiz', am: 'ጥያቄዎች' },
  'nav.chat': { en: 'Chat', am: 'ውይይት' },
  'nav.profile': { en: 'Profile', am: 'መገለጫ' },
  'nav.admin': { en: 'Admin', am: 'አስተዳደር' },
  'nav.about': { en: 'About', am: 'ስለ እኛ' },
  'nav.signIn': { en: 'Sign In', am: 'ግባ' },

  // Common
  'common.search': { en: 'Search', am: 'ፈልግ' },
  'common.download': { en: 'Download', am: 'አውርድ' },
  'common.share': { en: 'Share', am: 'አጋራ' },
  'common.save': { en: 'Save', am: 'አስቀምጥ' },
  'common.edit': { en: 'Edit', am: 'አስተካክል' },
  'common.delete': { en: 'Delete', am: 'አጥፋ' },
  'common.cancel': { en: 'Cancel', am: 'ይቅር' },
  'common.loading': { en: 'Loading...', am: 'በመጫን ላይ...' },
  'common.welcome': { en: 'Welcome', am: 'እንኳን ደህና መጡ' },
  'common.viewAll': { en: 'View All', am: 'ሁሉንም ይመልከቱ' },
  'common.readMore': { en: 'Read More', am: 'ተጨማሪ ያንብቡ' },
  'common.get': { en: 'Get', am: 'አግኝ' },
  'common.preview': { en: 'Preview', am: 'ቅድመ-እይታ' },
  'common.start': { en: 'Start', am: 'ጀምር' },
  'common.retry': { en: 'Retry', am: 'እንደገና ሞክር' },
  'common.send': { en: 'Send', am: 'ላክ' },
  'common.submit': { en: 'Submit', am: 'አስገባ' },
  'common.logout': { en: 'Logout', am: 'ውጣ' },
  'common.login': { en: 'Login', am: 'ግባ' },
  'common.signup': { en: 'Sign Up', am: 'ተመዝገብ' },
  'common.back': { en: 'Back', am: 'ተመለስ' },

  // Home
  'home.tagline': { en: 'Your Faith, Beautifully Nourished', am: 'እምነትህ በቆንጆ ሁኔታ የተመገበ' },
  'home.heroTitle1': { en: 'Walk Closer With', am: 'ከእግዚአብሔር ጋር' },
  'home.heroTitle2': { en: 'God Every Day', am: 'በየቀኑ ቅርብ በል' },
  'home.heroDesc': { en: 'Grace Book brings together daily Bible verses, free Christian books, inspiring courses, engaging quizzes, and a global community — all in one beautiful place.', am: 'ጌስ ቡክ የዕለቱን የመጽሐፍ ቅዱስ ጥቅሶች፣ ነፃ የክርስትና መጻሕፍት፣ ምልምሎች፣ ጥያቄዎች እና ዓለም አቀፍ ማህበረሰብ — ሁሉም በአንድ ቆንጆ ቦታ ላይ ያቀራቅራል።' },
  'home.readVerse': { en: "Read Today's Verse", am: 'የዕለቱን ጥቅስ ያንብቡ' },
  'home.exploreCourses': { en: 'Explore Courses', am: 'ኮርሶችን ያስሱ' },
  'home.verseOfDay': { en: 'Verse of the Day', am: 'የዕለቱ ጥቅስ' },
  'home.moreVerses': { en: 'More verses', am: 'ተጨማሪ ጥቅሶች' },
  'home.stats.members': { en: 'Community Members', am: 'የማህበረሰብ አባላት' },
  'home.stats.books': { en: 'Free Books', am: 'ነፃ መጻሕፍት' },
  'home.stats.courses': { en: 'Video Courses', am: 'የቪዲዮ ኮርሶች' },
  'home.stats.quizzes': { en: 'Quiz Participants', am: 'የጥያቄ ተሳታፊዎች' },
  'home.exploreTitle': { en: 'Explore Grace Book', am: 'ጌስ ቡክን ያስሱ' },
  'home.exploreDesc': { en: 'Everything you need to deepen your faith journey, all in one place.', am: 'እምነትህን ለማጠንከር የሚያስፈልግህ ሁሉ፣ ሁሉም በአንድ ቦታ።' },
  'home.card.verses': { en: 'Bible Verses', am: 'የመጽሐፍ ቅዱስ ጥቅሶች' },
  'home.card.versesDesc': { en: 'Daily inspiration from Scripture', am: 'ከመጽሐፍ ቅዱስ የዕለቱ ምክር' },
  'home.card.books': { en: 'Books Library', am: 'የመጻሕፍት ቤተ-መጻሕፍት' },
  'home.card.booksDesc': { en: 'Free Christian books to download', am: 'ለማውረድ ነፃ የክርስትና መጻሕፍት' },
  'home.card.courses': { en: 'Free Courses', am: 'ነፃ ኮርሶች' },
  'home.card.coursesDesc': { en: 'Learn and grow in your faith', am: 'ተማር እና በእምነትህ ያደጉ' },
  'home.card.quiz': { en: 'Quiz Challenge', am: 'የጥያቄ ተቋቋሚያ' },
  'home.card.quizDesc': { en: 'Test your biblical knowledge', am: 'የመጽሐፍ ቅዱስን እውቀትህን ይሞክሩ' },
  'home.card.chat': { en: 'Community', am: 'ማህበረሰብ' },
  'home.card.chatDesc': { en: 'Connect with believers worldwide', am: 'ከዓለም አቀፍ አማኞች ጋር ይገናኙ' },
  'home.card.about': { en: 'About Us', am: 'ስለ እኛ' },
  'home.card.aboutDesc': { en: 'Our mission and your support', am: 'ተልእኮች እና ድጋፍዎ' },
  'home.testimonialsTitle': { en: 'Loved by Believers Worldwide', am: 'በዓለም አቀፍ አማኞች የተወደደ' },
  'home.testimonialsDesc': { en: 'Real stories from our community', am: 'ከማህበረሰባችን እውነተኛ ታሪኮች' },
  'home.newsletterTitle': { en: 'Join Our Newsletter', am: 'ወደ ጋዜጣችን ይቀላቀሉ' },
  'home.newsletterDesc': { en: 'Get weekly Bible verses, new book releases, and course updates delivered to your inbox.', am: 'ሳምንታዊ የመጽሐፍ ቅዱስ ጥቅሶች፣ አዲስ የመጽሐፍ ቅዱስ መጻሕፍት እና የኮርስ ዜናዎች ወደ ኢሜይልዎ ይድረሱ።' },
  'home.subscribe': { en: 'Subscribe', am: 'ይመዝገቡ' },
  'home.subscribing': { en: 'Subscribing...', am: 'በመመዝገብ ላይ...' },

  // Verses page
  'verses.dailyTitle': { en: 'Daily Verse · Auto-rotating', am: 'የዕለቱ ጥቅስ · በራስ-ሽክክር' },
  'verses.library': { en: 'Verse Library', am: 'የጥቅስ ቤተ-መጻሕፍት' },
  'verses.searchPlaceholder': { en: 'Search verses...', am: 'ጥቅሶችን ይፈልጉ...' },
  'verses.noResults': { en: 'No Verses Found', am: 'ምንም ጥቅሶች አልተገኙም' },
  'verses.noResultsDesc': { en: 'Try a different search term or category filter.', am: 'የተለየ የፍለጋ ቃል ወይም ምድብ ይሞክሩ።' },
  'verses.copy': { en: 'Verse copied to clipboard', am: 'ጥቅስ ተቀድቷል' },
  'verses.shareTitle': { en: 'Share This Verse', am: 'ይህን ጥቅስ አጋራ' },
  'verses.newRandom': { en: 'New Random Verse', am: 'አዲስ ዘፈቀደ ጥቅስ' },
  'verses.fetching': { en: 'Fetching verse...', am: 'ጥቅስ በማምጣት ላይ...' },

  // Books
  'books.title': { en: 'Books Library', am: 'የመጻሕፍት ቤተ-መጻሕፍት' },
  'books.subtitle': { en: 'Free Christian Books', am: 'ነፃ የክርስትና መጻሕፍት' },
  'books.searchPlaceholder': { en: 'Search books...', am: 'መጻሕፍት ይፈልጉ...' },
  'books.noResults': { en: 'No Books Found', am: 'ምንም መጻሕፍት አልተገኙም' },
  'books.download': { en: 'Download', am: 'አውርድ' },
  'books.by': { en: 'by', am: 'በ' },

  // Courses
  'courses.title': { en: 'Free Video Courses', am: 'ነፃ የቪዲዮ ኮርሶች' },
  'courses.subtitle': { en: 'Grow in Your Faith', am: 'በእምነትህ ያደጉ' },
  'courses.allCourses': { en: 'All Courses', am: 'ሁሉም ኮርሶች' },
  'courses.available': { en: 'courses available', am: 'የሚገኙ ኮርሶች' },
  'courses.searchPlaceholder': { en: 'Search courses...', am: 'ኮርሶችን ይፈልጉ...' },
  'courses.start': { en: 'Start Course', am: 'ኮርስ ይጀምሩ' },
  'courses.continue': { en: 'Continue Watching', am: 'መመልከት ይቀጥሉ' },
  'courses.review': { en: 'Review Course', am: 'ኮርስ ይገምግሙ' },
  'courses.complete': { en: 'Mark as Complete', am: 'አጠናቅቋል ይባል' },
  'courses.completed': { en: 'Completed', am: 'ተጠናቅቋል' },
  'courses.noResults': { en: 'No Courses Found', am: 'ምንም ኮርሶች አልተገኙም' },

  // Quiz
  'quiz.tagline': { en: 'Test Your Knowledge', am: 'እውቀትዎን ይሞክሩ' },
  'quiz.title': { en: 'Quiz Challenge', am: 'የጥያቄ ተቋቋሚያ' },
  'quiz.desc': { en: 'Choose a category, answer 10 questions, earn points and build your streak!', am: 'ምድብ ይምረጡ፣ 10 ጥያቄዎችን ይመልሱ፣ ነጥብ ይሰበርቡ እና የአሸናፊነት ቅንብር ይገንቡ!' },
  'quiz.chooseCategory': { en: 'Choose a Category', am: 'ምድብ ይምረጡ' },
  'quiz.difficultyInfo': { en: 'Easy = 10pts · Medium = 20pts · Hard = 30pts · Streak bonus!', am: 'ቀላል = 10ነጥ · መካከለኛ = 20ነጥ · ከባድ = 30ነጥ · የአሸናፊነት ቀንስ!' },
  'quiz.questions': { en: 'questions', am: 'ጥያቄዎች' },
  'quiz.streak': { en: 'streak', am: 'ቅንብር' },
  'quiz.pts': { en: 'pts', am: 'ነጥ' },
  'quiz.complete': { en: 'Quiz Complete!', am: 'ጥያቄ ተጠናቅቋል!' },
  'quiz.points': { en: 'points out of', am: 'ነጥብ ከ' },
  'quiz.max': { en: 'max', am: 'ከፍተኛ' },
  'quiz.maxStreak': { en: 'Max Streak', am: 'ከፍተኛ ቅንብር' },
  'quiz.scoreRate': { en: 'Score Rate', am: 'የነጥብ መጠን' },
  'quiz.retry': { en: 'Retry Quiz', am: 'ጥያቄ እንደገና ይሞክሩ' },
  'quiz.changeCategory': { en: 'Change Category', am: 'ምድብ ይቀይሩ' },
  'quiz.leaderboard': { en: 'Leaderboard', am: 'የመሪዎች ሰንጴ' },
  'quiz.noScores': { en: 'No scores yet. Be the first!', am: 'እስካሁን ምንም ነጥብ የለም። የመጀመሪያው ይሁኑ!' },
  'quiz.nextQuestion': { en: 'Next Question', am: 'ቀጣይ ጥያቄ' },
  'quiz.seeResults': { en: 'See Results', am: 'ውጤቶችን ይመልከቱ' },
  'quiz.correct': { en: 'Correct!', am: 'ትክክል!' },
  'quiz.wrong': { en: "Time's up or wrong answer.", am: 'ጊዜ አልቋል ወይም የተሳሳተ መልስ።' },
  'quiz.nextInMoment': { en: 'Next question in a moment...', am: 'ቀጣይ ጥያቄ በቅርቡ...' },
  'quiz.signInSave': { en: 'Sign in to save your scores and appear on the leaderboard!', am: 'ነጥቦችዎን ለማስቀመጥ እና በመሪዎች ሰንጴ ለመታየት ይግቡ!' },

  // Chat
  'chat.title': { en: 'Chat', am: 'ውይይት' },
  'chat.searchRooms': { en: 'Search rooms...', am: 'ክፍሎችን ይፈልጉ...' },
  'chat.roomName': { en: 'Room name', am: 'የክፍል ስም' },
  'chat.public': { en: 'Public', am: 'ይፋዊ' },
  'chat.private': { en: 'Private', am: 'የግል' },
  'chat.createRoom': { en: 'Create Room', am: 'ክፍል ይፍጠሩ' },
  'chat.members': { en: 'members', am: 'አባላት' },
  'chat.noMessages': { en: 'No messages yet. Start the conversation!', am: 'እስካሁን ምንም መልዕክት የለም። ውይይት ይጀምሩ!' },
  'chat.typeMessage': { en: 'Type a message...', am: 'መልዕክት ይጻፉ...' },
  'chat.selectRoom': { en: 'Select a Chat Room', am: 'የውይይት ክፍል ይምረጡ' },
  'chat.selectRoomDesc': { en: 'Choose a room from the sidebar to start chatting with the community.', am: 'ለመውይይት ከጎን አሞሌ ክፍል ይምረጡ።' },
  'chat.signInChat': { en: 'Sign In to Chat', am: 'ለመውይይት ይግቡ' },
  'chat.signInChatDesc': { en: 'Join our global community of believers. Sign in to start messaging, create groups, and connect with fellow Christians worldwide.', am: 'ለዓለም አቀፍ አማኞች ማህበረሰባችን ይቀላቀሉ። ለመልዕክት ለመላክ፣ ቡድኖችን ለመፍጠር እና ከክርስቲያን ወንድሞች ጋር ለመገናኘት ይግቡ።' },
  'chat.replyingTo': { en: 'Replying to:', am: 'ለሚመልሱት:' },
  'chat.noRooms': { en: 'No rooms found', am: 'ምንም ክፍሎች አልተገኙም' },

  // Profile / Auth
  'profile.welcomeBack': { en: 'Welcome Back', am: 'እንኳን ደህና መጡ' },
  'profile.joinGrace': { en: 'Join Grace Book', am: 'ጌስ ቡክ ይቀላቀሉ' },
  'profile.signInDesc': { en: 'Sign in to your account', am: 'ወደ መለያዎ ይግቡ' },
  'profile.signupDesc': { en: 'Create your free account', am: 'ነፃ መለያ ይፍጠሩ' },
  'profile.username': { en: 'Username', am: 'የተጠቃሚ ስም' },
  'profile.fullName': { en: 'Full Name', am: 'ሙሉ ስም' },
  'profile.email': { en: 'Email', am: 'ኢሜይል' },
  'profile.password': { en: 'Password', am: 'የይለፍ ቃል' },
  'profile.editProfile': { en: 'Edit Profile', am: 'መገለጫ አስተካክል' },
  'profile.password2': { en: 'Password', am: 'የይለፍ ቃል' },
  'profile.changePassword': { en: 'Change Password', am: 'የይለፍ ቃል ይቀይሩ' },
  'profile.newPassword': { en: 'New password', am: 'አዲስ የይለፍ ቃል' },
  'profile.update': { en: 'Update', am: 'ያዘምኑ' },
  'profile.accountCreated': { en: 'Account created! You are now signed in.', am: 'መለያ ተፈጥሯል! አሁን ገብተዋል።' },
  'profile.welcomeBackMsg': { en: 'Welcome back!', am: 'እንኳን ደህና መጡ!' },
  'profile.enterUsername': { en: 'Please enter a username', am: 'እባክዎ የተጠቃሚ ስም ያስገቡ' },
  'profile.memberSince': { en: 'Member since', am: 'ከዚህ ጊዜ ጀምሮ አባል' },
  'profile.quizAttempts': { en: 'Quiz Attempts', am: 'የጥያቄ ሙከራዎች' },
  'profile.booksDownloaded': { en: 'Books Downloaded', am: 'የወረዱ መጻሕፍት' },
  'profile.coursesCompleted': { en: 'Courses Completed', am: 'የተጠናቀቁ ኮርሶች' },
  'profile.bestScore': { en: 'Best Quiz Score', am: 'ከፍተኛ የጥያቄ ነጥብ' },
  'profile.recentResults': { en: 'Recent Quiz Results', am: 'የቅርብ ጊዜ የጥያቄ ውጤቶች' },
  'profile.noAccount': { en: "Don't have an account? Sign up", am: 'መለያ የለዎትም? ይመዝገቡ' },
  'profile.haveAccount': { en: 'Already have an account? Sign in', am: 'መለያ አለዎት? ይግቡ' },
  'profile.pleaseWait': { en: 'Please wait...', am: 'እባክዎ ይጠብቁ...' },

  // About
  'about.tagline': { en: 'About Grace Book', am: 'ስለ ጌስ ቡክ' },
  'about.title': { en: 'Our Heart & Mission', am: 'ልባችን እና ተልእካችን' },
  'about.desc': { en: 'Connecting believers worldwide through Scripture, learning, and community.', am: 'አማኞችን በመጽሐፍ ቅዱስ፣ በመማር እና በማህበረሰብ አማካኝነት ያገናኛል።' },
  'about.aboutUs': { en: 'About Us', am: 'ስለ እኛ' },
  'about.support': { en: 'Support', am: 'ድጋፍ' },
  'about.contact': { en: 'Contact', am: 'አግኙን' },
  'about.mission': { en: 'Our Mission', am: 'ተልእካችን' },
  'about.vision': { en: 'Our Vision', am: 'ራዕያችን' },
  'about.weBelieve': { en: 'What We Believe', am: 'እናንተ የምናምን' },
  'about.team': { en: 'Our Team', am: 'ቡድናችን' },
  'about.followUs': { en: 'Follow Us', am: 'ይከታተሉን' },
  'about.helpCenter': { en: 'Help Center', am: 'የእገዛ ማዕከል' },
  'about.faqDesc': { en: 'Frequently asked questions about Grace Book', am: 'ስለ ጌስ ቡክ በተደጋጋሚ የሚነሱ ጥያቄዎች' },
  'about.prayerRequest': { en: 'Submit a Prayer Request', am: 'የጸሎት ጥያቄ ያስገቡ' },
  'about.prayerDesc': { en: 'Our team will pray over your request', am: 'ቡድናችን ለጥያቄዎ ይጸልያል' },
  'about.getInTouch': { en: 'Get in Touch', am: 'በቀጥታ ያግኙን' },
  'about.hearFromYou': { en: 'We would love to hear from you', am: 'ከእርስዎ መስማት እንወዳለን' },
  'about.emailUs': { en: 'Email Us', am: 'ኢሜይል ይላኩልን' },
  'about.community': { en: 'Community', am: 'ማህበረሰብ' },
  'about.joinChat': { en: 'Join our global chat', am: 'ለዓለም አቀፍ ውይይት ይቀላቀሉ' },
  'about.resources': { en: 'Resources', am: 'አቅርቦቶች' },
  'about.resourcesVal': { en: '100+ books & courses', am: '100+ መጻሕፍት እና ኮርሶች' },
  'about.yourName': { en: 'Your name', am: 'የእርስዎ ስም' },
  'about.yourEmail': { en: 'Your email', am: 'የእርስዎ ኢሜይል' },
  'about.subject': { en: 'Subject', am: 'ርዕስ' },
  'about.yourMessage': { en: 'Your message...', am: 'መልዕክትዎ...' },
  'about.sharePrayer': { en: 'Share your prayer request...', am: 'የጸሎት ጥያቄዎን ያጋራ...' },
  'about.sending': { en: 'Sending...', am: 'በመላክ ላይ...' },
  'about.submitting': { en: 'Submitting...', am: 'በማስገባት ላይ...' },
  'about.sendMessage': { en: 'Send Message', am: 'መልዕክት ላክ' },
  'about.submitPrayer': { en: 'Submit Prayer Request', am: 'የጸሎት ጥያቄ ያስገቡ' },
  'about.developedBy': { en: 'This app was developed by Addis Power', am: 'ይህ መተግበሪያ በ Addis Power ተሰራ' },

  // Footer
  'footer.tagline': { en: 'Your premium Christian faith companion. Daily Bible verses, free books, life-changing courses, engaging quizzes, and a global community of believers united in Christ.', am: 'የእርስዎ ቅርብ የክርስትና እምነት አጋር። የዕለቱ የመጽሐፍ ቅዱስ ጥቅሶች፣ ነፃ መጻሕፍት፣ ህይወት የለወጠ ኮርሶች፣ ጥያቄዎች እና በክርስቶስ የተዋሐደ ዓለም አቀፍ ማህበረሰብ።' },
  'footer.explore': { en: 'Explore', am: 'ያስሱ' },
  'footer.connect': { en: 'Connect', am: 'ይገናኙ' },
  'footer.bibleVerses': { en: 'Bible Verses', am: 'የመጽሐፍ ቅዱስ ጥቅሶች' },
  'footer.booksLibrary': { en: 'Books Library', am: 'የመጻሕፍት ቤተ-መጻሕፍት' },
  'footer.freeCourses': { en: 'Free Courses', am: 'ነፃ ኮርሶች' },
  'footer.quizChallenge': { en: 'Quiz Challenge', am: 'የጥያቄ ተቋቋሚያ' },
  'footer.communityChat': { en: 'Community Chat', am: 'የማህበረሰብ ውይይት' },
  'footer.aboutUs': { en: 'About Us', am: 'ስለ እኛ' },
  'footer.support': { en: 'Support & FAQ', am: 'ድጋፍ እና ጥያቄዎች' },
  'footer.contactUs': { en: 'Contact Us', am: 'አግኙን' },
  'footer.prayerRequests': { en: 'Prayer Requests', am: 'የጸሎት ጥያቄዎች' },
  'footer.rights': { en: 'All rights reserved.', am: 'ሁሉም መብቶች የተጠበቁ ናቸው።' },
  'footer.madeWith': { en: 'Made with', am: 'ተሰራ በ' },
  'footer.forKingdom': { en: 'for the Kingdom', am: 'ለመንግሥት' },
  'footer.developedBy': { en: 'Developed by Addis Power', am: 'በ Addis Power ተሰራ' },

  // Admin
  'admin.title': { en: 'Admin Panel', am: 'የአስተዳደር ፓናል' },
  'admin.access': { en: 'Admin Access', am: 'የአስተዳደር መዳረሻ' },
  'admin.enterPassword': { en: 'Enter the admin password to continue', am: 'ለመቀጠል የአስተዳደር የይለፍ ቃል ያስገቡ' },
  'admin.adminPassword': { en: 'Admin password', am: 'የአስተዳደር የይለፍ ቃል' },
  'admin.accessDashboard': { en: 'Access Dashboard', am: 'ዳሽቦርድ ይድረሱ' },
  'admin.manageAll': { en: 'Manage all content and users', am: 'ሁሉንም ይዘት እና ተጠቃሚዎች ያስተዳድሩ' },
  'admin.dashboard': { en: 'Dashboard', am: 'ዳሽቦርድ' },
  'admin.verses': { en: 'Verses', am: 'ጥቅሶች' },
  'admin.quizzes': { en: 'Quizzes', am: 'ጥያቄዎች' },
  'admin.users': { en: 'Users', am: 'ተጠቃሚዎች' },
  'admin.messages': { en: 'Messages', am: 'መልዕክቶች' },
  'admin.addNew': { en: 'Add New', am: 'አዲስ ይጨምሩ' },
  'admin.save': { en: 'Save', am: 'አስቀምጥ' },

  // Categories
  'cat.all': { en: 'All', am: 'ሁሉም' },
  'cat.salvation': { en: 'Salvation', am: 'የድነት' },
  'cat.strength': { en: 'Strength', am: 'ጥንካሬ' },
  'cat.comfort': { en: 'Comfort', am: 'ማፅናናት' },
  'cat.faith': { en: 'Faith', am: 'እምነት' },
  'cat.love': { en: 'Love', am: 'ፍቅር' },
  'cat.hope': { en: 'Hope', am: 'ተስፋ' },
  'cat.bible': { en: 'Bible', am: 'መጽሐፍ ቅዱስ' },
  'cat.general': { en: 'General Knowledge', am: 'አጠቃላይ እውቀት' },
  'cat.science': { en: 'Science', am: 'ሳይንስ' },
  'cat.history': { en: 'History', am: 'ታሪክ' },
  'cat.geography': { en: 'Geography', am: 'ጂኦግራፊ' },
  'cat.bibleAm': { en: 'Bible (Amharic)', am: 'የመጽሐፍ ቅዱስ ጥያቄዎች' },

  // Verse categories (books)
  'cat.theology': { en: 'Theology', am: 'ስነ-መለኮት' },
  'cat.classic': { en: 'Classic', am: 'ክላሲክ' },
  'cat.spiritual': { en: 'Spiritual Growth', am: 'መንፈሳዊ እድገት' },
  'cat.devotional': { en: 'Devotional', am: 'ሥርዓተ-ጸሎት' },
  'cat.apologetics': { en: 'Apologetics', am: 'መከላከያ' },
  'cat.generalCat': { en: 'General', am: 'አጠቃላይ' },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem('grace-lang') as Language | null;
    return stored ?? 'en';
  });

  useEffect(() => {
    localStorage.setItem('grace-lang', lang);
    document.documentElement.lang = lang;
    document.body.classList.toggle('lang-am', lang === 'am');
  }, [lang]);

  const setLang = (l: Language) => setLangState(l);
  const toggleLang = () => setLangState((prev) => (prev === 'en' ? 'am' : 'en'));

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
