import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Calendar, Settings, LogOut, Sun, TrendingUp, Trophy, Layers, RefreshCw, Users } from 'lucide-react';
import { signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebaseConfig';
import type { User } from 'firebase/auth';
import confetti from 'canvas-confetti';

type TimeSection = 'morning' | 'afternoon' | 'evening' | 'night';
type HomeSection = 'structure' | 'progression' | 'economy' | 'workflows' | 'community';

const getTimeSection = (): TimeSection => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const homeSections: { id: HomeSection; label: string }[] = [
  { id: 'structure', label: 'structure' },
  { id: 'progression', label: 'progression' },
  { id: 'economy', label: 'economy' },
  { id: 'workflows', label: 'workflows' },
  { id: 'community', label: 'community' }
];

const timeSections: { id: TimeSection; label: string }[] = [
  { id: 'morning', label: 'morning' },
  { id: 'afternoon', label: 'afternoon' },
  { id: 'evening', label: 'evening' },
  { id: 'night', label: 'night' }
];

const getBackgroundConfig = (section: TimeSection | HomeSection): string => {
  // map time sections to home section backgrounds
  const timeToHomeMap: Record<TimeSection, HomeSection> = {
    morning: 'progression',
    afternoon: 'economy',
    evening: 'workflows',
    night: 'community'
  };
  
  const mappedSection = (section in timeToHomeMap) ? timeToHomeMap[section as TimeSection] : section;
  
  const configs: Record<HomeSection, string> = {
    structure: 'linear-gradient(to bottom, #0f172a, #1e3a8a)',
    community: 'linear-gradient(to bottom, #0f172a, #1e3a8a)',
    progression: 'linear-gradient(to bottom, #f59f00, #f783ac)',
    economy: 'linear-gradient(to bottom, #4dabf7, #228be6)',
    workflows: 'linear-gradient(to bottom, #ff922b, #d6336c)'
  };
  return configs[mappedSection as HomeSection];
};

const describeSector = (cx: number, cy: number, r: number, startAngle: number, endAngle: number): string => {
  const rad = (deg: number) => (Math.PI / 180) * deg;
  const x1 = cx + r * Math.cos(rad(startAngle));
  const y1 = cy + r * Math.sin(rad(startAngle));
  const x2 = cx + r * Math.cos(rad(endAngle));
  const y2 = cy + r * Math.sin(rad(endAngle));
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const SvgLayer = ({ section }: { section: TimeSection | HomeSection }) => {
  const makeStars = (n: number, maxY = 100, minO = 0.3, maxO = 1) =>
    Array.from({ length: n }).map((_, i) => ({
      key: i,
      cx: Math.random() * 100,
      cy: Math.random() * maxY,
      r: Math.random() * 1 + 0.5,
      o: Math.random() * (maxO - minO) + minO
    }));

  const starsStructure = useMemo(() => makeStars(100), []);
  const starsCommunity = useMemo(() => makeStars(120), []);
  const starsProgression = useMemo(() => makeStars(30, 40, 0.2, 0.6), []);
  const starsWorkflows = useMemo(() => makeStars(40, 60, 0.2, 0.6), []);
  const starsMorning = useMemo(() => makeStars(20, 40, 0.2, 0.4), []);
  const starsEvening = useMemo(() => makeStars(40, 60, 0.3, 0.6), []);
  const starsNight = useMemo(() => makeStars(100), []);

  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <radialGradient id="sun">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="moonGradient" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {section === 'structure' && starsStructure.map(s => (
        <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
      ))}

      {section === 'community' && (
        <>
          <circle cx="80%" cy="20%" r="40" fill="white" />
          <circle cx="85%" cy="20%" r="40" fill="url(#moonGradient)" />
          {starsCommunity.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}

      {section === 'progression' && (
        <>
          <circle cx="50%" cy="105%" r="90" fill="orange" opacity="0.6" />
          {starsProgression.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}

      {section === 'economy' && (
        <>
          <path d="M60 100 Q 55 80 75 80 Q 85 60 105 80 Q 125 80 130 95 Q 140 110 120 115 L60 115 Z" fill="white" opacity="0.4" />
          <path d="M200 140 Q 190 120 210 120 Q 225 100 245 120 Q 265 120 270 135 Q 280 150 260 155 L200 155 Z" fill="white" opacity="0.4" />
        </>
      )}

      {section === 'workflows' && (
        <>
          <path d="M100 80 Q 95 65 115 65 Q 125 50 145 65 Q 165 65 170 75 Q 180 90 160 95 L100 95 Z" fill="white" opacity="0.3" />
          <path d="M250 130 Q 240 115 260 115 Q 275 100 295 115 Q 315 115 320 125 Q 330 140 310 145 L250 145 Z" fill="white" opacity="0.3" />
          {starsWorkflows.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}

      {section === 'morning' && (
        <>
          <circle cx="85%" cy="15%" r="60" fill="url(#sun)" />
          {starsMorning.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}

      {section === 'afternoon' && (
        <>
          <path d="M60 100 Q 55 80 75 80 Q 85 60 105 80 Q 125 80 130 95 Q 140 110 120 115 L60 115 Z" fill="white" opacity="0.4" />
          <path d="M200 140 Q 190 120 210 120 Q 225 100 245 120 Q 265 120 270 135 Q 280 150 260 155 L200 155 Z" fill="white" opacity="0.4" />
        </>
      )}

      {section === 'evening' && (
        <>
          <circle cx="20%" cy="80%" r="80" fill="orange" opacity="0.5" />
          {starsEvening.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}

      {section === 'night' && (
        <>
          <circle cx="80%" cy="20%" r="40" fill="white" />
          <circle cx="85%" cy="20%" r="40" fill="url(#moonGradient)" />
          {starsNight.map(s => (
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o} />
          ))}
        </>
      )}
    </svg>
  );
};

type CardProps = { children: React.ReactNode; urgent?: boolean; overdrive?: boolean };
function Card({ children, urgent = false, overdrive = false }: CardProps) {
  let style: React.CSSProperties = {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "1rem 1.25rem",
    marginBottom: ".75rem",
    backdropFilter: "blur(15px) saturate(140%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(0,0,0,0.25)"
  };
  if (urgent) style = { ...style, animation: "pulse 2s infinite alternate", boxShadow: "0 0 16px rgba(244,63,94,0.6)" };
  if (overdrive) style = { ...style, background: "rgba(236,72,153,0.2)", boxShadow: "0 0 25px rgba(236,72,153,0.8)" };
  return <div style={style}>{children}</div>;
}

function PendingRequest({ uid, onAccept, getEmail }: { uid: string; onAccept: (uid: string) => void; getEmail: (uid: string) => Promise<string> }) {
  const [email, setEmail] = useState('loading...');
  
  useEffect(() => {
    getEmail(uid).then(setEmail);
  }, [uid]);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      fontSize: '0.85rem'
    }}>
      <span>{email}</span>
      <button
        onClick={() => onAccept(uid)}
        style={{
          padding: '0.25rem 0.5rem',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '0.75rem',
          cursor: 'pointer'
        }}>
        accept
      </button>
    </div>
  );
}

function FriendItem({ uid, onRemove, onView, getEmail }: { uid: string; onRemove: (uid: string) => void; onView: (uid: string) => void; getEmail: (uid: string) => Promise<string> }) {
  const [email, setEmail] = useState('loading...');
  
  useEffect(() => {
    getEmail(uid).then(setEmail);
  }, [uid]);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem',
      background: 'rgba(0,0,0,0.02)',
      borderRadius: '6px',
      marginBottom: '0.5rem',
      fontSize: '0.85rem'
    }}>
      <span>{email}</span>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => onView(uid)}
          style={{
            padding: '0.25rem 0.5rem',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}>
          view
        </button>
        <button
          onClick={() => onRemove(uid)}
          style={{
            padding: '0.25rem 0.5rem',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}>
          remove
        </button>
      </div>
    </div>
  );
}

export default function DailyNine() {
  const [view, setView] = useState<'home' | 'today' | 'history' | 'settings' | 'friend' | 'leaderboard'>('home');
  const [homeSection, setHomeSection] = useState<HomeSection>('structure');
  const [autoTimeSection, setAutoTimeSection] = useState<TimeSection>(getTimeSection());
  const [manualOverride, setManualOverride] = useState<TimeSection | null>(null);
  const [layers, setLayers] = useState<{ id: string; bg: string; section: TimeSection | HomeSection; ready: boolean }[]>([]);
  const [contentVisible, setContentVisible] = useState<boolean>(true);
  const [tasks, setTasks] = useState<{ id: string; title: string; completed: boolean; routineType: string | null }[]>([]);
  const [newTask, setNewTask] = useState('');
  const [morningRoutine, setMorningRoutine] = useState<string[]>([]);
  const [nightRoutine, setNightRoutine] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'today' | 'week'>('today');
  const [lastLeaderboardUpdate, setLastLeaderboardUpdate] = useState<Date | null>(null);

  const [entries, setEntries] = useState<{date: string; completedCount: number; totalTasks: number;}[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);

  // friend stuff
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [viewingFriend, setViewingFriend] = useState<string | null>(null);
  const [friendTasks, setFriendTasks] = useState<any[]>([]);

  // viewingFriend only used internally
  void viewingFriend;

  const currentSection = view === 'home' ? homeSection : (manualOverride || autoTimeSection);
  const [editingDate, setEditingDate] = useState<string>(() => getLocalDateString());

  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  


  // auto time tracking for today view
  useEffect(() => {
    const interval = setInterval(() => {
      const newSection = getTimeSection();
      if (newSection !== autoTimeSection) {
        setAutoTimeSection(newSection);
        if (view === 'today' && !manualOverride) {
          transitionToSection(newSection);
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [autoTimeSection, manualOverride, view]);

const typingRef = useRef(false);

// removed the delayed ensureRoutinesExist - now called directly during load

// save routine changes to firestore
useEffect(() => {
  if (!user || loading) return;
  
  const saveTimer = setTimeout(async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        morningRoutine,
        nightRoutine
      });
    } catch (err) {
      console.error('failed to save routines:', err);
    }
  }, 1000);
  
  return () => clearTimeout(saveTimer);
}, [morningRoutine, nightRoutine, user, loading]);

useEffect(() => {
  const initialSection =
    user && view === 'today'
      ? (manualOverride || autoTimeSection)
      : view === 'home'
        ? homeSection
        : (manualOverride || autoTimeSection);

  const initialLayer = {
    id: initialSection + '-' + Date.now(),
    bg: getBackgroundConfig(initialSection),
    section: initialSection,
    ready: false
  };

  setLayers([initialLayer]);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setLayers(l =>
        l.map(layer =>
          layer.id === initialLayer.id ? { ...layer, ready: true } : layer
        )
      );
    });
  });
}, [user, view]);

useEffect(() => {
  let mounted = true;

  const initAuth = async () => {
    // handle redirect result (for mobile) but don't block auth listener
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && mounted) {
          console.log('redirect success:', result.user.email);
        }
      })
      .catch((error) => {
        console.error('redirect error:', error);
      });

    // set up auth listener (starts immediately, doesn't wait for redirect)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;
      
      setLoading(true);

      if (firebaseUser) {
        setUser(firebaseUser);
        setEditingDate(getLocalDateString());
        loadUserData(firebaseUser.uid)
          .then(() => {
            setView('today');
          })
          .catch((error) => {
            console.error('loadUserData failed:', error);
            setView('today');
          })
          .finally(() => setLoading(false));
      } else {
        setUser(null);
        setTasks([]);
        setView('home');
        setLoading(false);
      }
    });

    return unsubscribe;
  };

  const cleanupPromise = initAuth();

  return () => {
    mounted = false;
    cleanupPromise.then(unsub => unsub?.());
  };
}, []);

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const loadUserData = async (uid: string, dateToLoad?: string) => {
  const targetDate = dateToLoad || getLocalDateString();
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);
  
  // ensure user doc exists with email
  if (!userDoc.exists() && user?.email) {
    await setDoc(userDocRef, {
      email: user.email,
      username: null, 
      tasks: [],
      friends: [],
      pendingRequests: [],
      createdAt: serverTimestamp()
    });
    setShowUsernamePrompt(true);
    
  } else if (userDoc.exists()) {
    // check if username exists
    if (!userDoc.data().username) {
      setShowUsernamePrompt(true);
    }
    
    // backfill email if missing
    if (user?.email && !userDoc.data().email) {
      await updateDoc(userDocRef, { email: user.email });
    }
  }
  
  const entryRef = doc(db, 'users', uid, 'entries', targetDate);
  const entryDoc = await getDoc(entryRef);

  let loadedTasks: any[] = [];

if (entryDoc.exists()) {
  loadedTasks = entryDoc.data().tasks || [];
} else {
  loadedTasks = [];
}

  if (loadedTasks && loadedTasks.length > 0) {
    setTasks(loadedTasks);
  } else {
    setTasks([]);
  }

  // only check rollover if loading today
  if (targetDate === getLocalDateString()) {
    await checkRollover(uid);
    
    // reload today's tasks after rollover
  }

  if (userDoc.exists()) {
    const data = userDoc.data();
    setHomeSection(data.homeSection || 'structure');
    setManualOverride(data.manualOverride || null);
    setMorningRoutine(data.morningRoutine || []);
    setNightRoutine(data.nightRoutine || []);
    
    // add routine tasks immediately after loading if viewing today
    if (targetDate === getLocalDateString()) {
      const morning = data.morningRoutine || [];
      const night = data.nightRoutine || [];
      
      if (morning.length > 0 || night.length > 0) {
        const existingTitles = loadedTasks.map((t: any) => t.title);
        
        const missingMorning = morning.filter((title: string) => !existingTitles.includes(title));
        const missingNight = night.filter((title: string) => !existingTitles.includes(title));
        
        const newTasks = [
          ...missingMorning.map((title: string) => ({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            title,
            completed: false,
            routineType: 'morning'
          })),
          ...missingNight.map((title: string) => ({
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            title,
            completed: false,
            routineType: 'night'
          }))
        ];
        
        if (newTasks.length > 0) {
          loadedTasks = [...loadedTasks, ...newTasks];
          // don't write to firestore here, let the save useEffect handle it
        }
      }
    }
  }
};

const checkRollover = async (uid: string) => {
  try {
    const today = getLocalDateString();
    
    console.log('[ROLLOVER] checking rollover', { today, uid });

    const todayRef = doc(db, 'users', uid, 'entries', today);
    const todaySnap = await getDoc(todayRef);
    
    console.log('[ROLLOVER] today exists?', todaySnap.exists(), 'tasks:', todaySnap.exists() ? (todaySnap.data().tasks || []).length : 0);
    
    // skip if today already has tasks (means we already did rollover or user added tasks)
    if (todaySnap.exists() && (todaySnap.data().tasks || []).length > 0) {
      console.log('[ROLLOVER] skipping - today already has tasks');
      return;
    }

    // find the LAST entry (most recent before today)
    const entriesRef = collection(db, 'users', uid, 'entries');
    const q = query(entriesRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    let lastEntry: any = null;
    let lastEntryId: string | null = null;
    
    snapshot.forEach(docSnap => {
      if (docSnap.id < today && !lastEntry) {
        lastEntry = docSnap.data();
        lastEntryId = docSnap.id;
      }
    });
    
    console.log('[ROLLOVER] last entry date:', lastEntryId);
    
    if (!lastEntry || !lastEntryId) {
      console.log('[ROLLOVER] skipping - no previous entries');
      return;
    }
    
    console.log('[ROLLOVER] last entry data:', lastEntry);
    
    // skip if already rolled
    if (lastEntry.rolloverApplied) {
      console.log('[ROLLOVER] skipping - already rolled', { rolloverApplied: lastEntry.rolloverApplied });
      return;
    }

    const allTasks = lastEntry.tasks || [];
    
    console.log('[ROLLOVER] last entry tasks:', allTasks);
    
    // get incomplete non-routine tasks
    const incomplete = allTasks.filter((t: any) => !t.completed);
    const rolled = incomplete
      .filter((t: any) => !t.routineType || t.routineType === null)
      .map((t: any) => ({
        ...t,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
        routineType: null,
        completed: false
      }));

    console.log('[ROLLOVER] rolling', rolled.length, 'tasks');

    // mark as rolled even if nothing to roll
    const lastEntryRef = doc(db, 'users', uid, 'entries', lastEntryId);
    await updateDoc(lastEntryRef, { rolloverApplied: true });

    if (!rolled.length) {
      console.log('[ROLLOVER] no tasks to roll');
      return;
    }

    // write rolled tasks to TODAY's entry (not user base doc)
    const existingToday = todaySnap.exists() ? (todaySnap.data().tasks || []) : [];
    const todayTasks = [...existingToday, ...rolled];

    await setDoc(
      todayRef,
      {
        tasks: todayTasks,
        completedCount: todayTasks.filter((t: any) => t.completed).length,
        totalTasks: todayTasks.length,
        timestamp: serverTimestamp()
      },
      { merge: true }
    );

    console.log(`[ROLLOVER] SUCCESS: auto-rolled ${rolled.length} tasks from ${lastEntryId} to ${today}`);
  } catch (error) {
    console.error('[ROLLOVER] ERROR:', error);
  }
};


const manualRollover = async () => {
  if (!user) return;
  
  try {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const todayRef = doc(db, "users", user.uid, "entries", today);
    const snap = await getDoc(todayRef);
    
    if (!snap.exists()) {
      alert("no tasks found for today");
      return;
    }

    const data = snap.data();
    const allTasks = data.tasks || [];
    
    // get incomplete non-routine tasks
    const incomplete = allTasks.filter((t: any) => !t.completed);
    const rolled = incomplete
      .filter((t: any) => !t.routineType || t.routineType === null)
      .map((t: any) => ({
        ...t,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
        completed: false,
        routineType: null
      }));
    
    if (!rolled.length) {
      alert("nothing to roll - all incomplete tasks are routine tasks");
      return;
    }

    // get tomorrow's existing tasks
    const tomorrowRef = doc(db, "users", user.uid, "entries", tomorrow);
    const tomorrowSnap = await getDoc(tomorrowRef);
    const tomorrowData = tomorrowSnap.exists() ? tomorrowSnap.data() : {};
    const existingTomorrowTasks = tomorrowData.tasks || [];
    
    // merge rolled tasks into tomorrow
    const updatedTomorrow = [...existingTomorrowTasks, ...rolled];

    await setDoc(
      tomorrowRef,
      {
        tasks: updatedTomorrow,
        completedCount: updatedTomorrow.filter((t: any) => t.completed).length,
        totalTasks: updatedTomorrow.length,
        timestamp: serverTimestamp()
      },
      { merge: true }
    );

    // remove rolled tasks from today
    const cleaned = allTasks.filter(
      (t: any) => !rolled.some((r: any) => r.title === t.title && !t.completed)
    );

    await updateDoc(todayRef, {
      tasks: cleaned,
      completedCount: cleaned.filter((t: any) => t.completed).length,
      totalTasks: cleaned.length,
      rolloverApplied: true  // mark as rolled so auto rollover skips it tomorrow
    });

    setTasks(cleaned);
    alert(`rolled ${rolled.length} task${rolled.length > 1 ? "s" : ""} to tomorrow`);
  } catch (error) {
    console.error('rollover failed:', error);
    alert('rollover failed - check console');
  }
};


const planTomorrow = async () => {
  if (!user) return;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  setEditingDate(tomorrow);
  
  // load tomorrow's existing tasks
  const tomorrowRef = doc(db, 'users', user.uid, 'entries', tomorrow);
  const tomorrowSnap = await getDoc(tomorrowRef);
  
  let existingTasks = tomorrowSnap.exists() ? (tomorrowSnap.data().tasks || []) : [];
  
  // only add routine tasks if they don't already exist
const existingTitles = existingTasks.map((t: { title: string }) => t.title);

  
  const morningTasks = morningRoutine
    .filter(t => t.trim() && !existingTitles.includes(t))
    .map(title => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      completed: false,
      routineType: 'morning'
    }));
  
  const nightTasks = nightRoutine
    .filter(t => t.trim() && !existingTitles.includes(t))
    .map(title => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      completed: false,
      routineType: 'night'
    }));
  
  setTasks([...existingTasks, ...morningTasks, ...nightTasks]);
};

const backToToday = () => {
  if (!user) return;
  const today = getLocalDateString();
  setEditingDate(today);
  loadUserData(user.uid);
};

const viewPastEntry = async (date: string) => {
  if (!user) return;
  setEditingDate(date);
  
  const entryRef = doc(db, 'users', user.uid, 'entries', date);
  const entrySnap = await getDoc(entryRef);
  
  if (entrySnap.exists()) {
    setTasks(entrySnap.data().tasks || []);
  } else {
    setTasks([]);
  }
  
  setView('today'); // reuse today view for editing
};


useEffect(() => {
  if (!user || loading) return;
  
  const timeoutId = setTimeout(async () => {
    const today = getLocalDateString();
    
    const entryRef = doc(db, 'users', user.uid, 'entries', editingDate);
    await setDoc(entryRef, {
      tasks,
      completedCount: tasks.filter(t => t.completed).length,
      totalTasks: tasks.length,
      timestamp: serverTimestamp()
    }, { merge: true });
    
    if (editingDate === today) {
      await updateDoc(doc(db, 'users', user.uid), {
        homeSection,
        manualOverride,
        morningRoutine,
        nightRoutine,
        updatedAt: serverTimestamp()
      });
    }
  }, 1000);
  
  return () => clearTimeout(timeoutId);
}, [tasks, homeSection, manualOverride, morningRoutine, nightRoutine, user, loading, editingDate]);

useEffect(() => {
  if (!user) return;
  if (autoTimeSection === 'morning') addRoutineTasks('morning');
  if (autoTimeSection === 'night') addRoutineTasks('night');
}, [autoTimeSection, user]);

const loadEntries = async () => {
  if (!user || entriesLoaded) return;
  try {
    const entriesRef = collection(db, 'users', user.uid, 'entries');
    const q = query(entriesRef, orderBy('timestamp', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    const today = getLocalDateString();
    const data = snapshot.docs
      .filter(d => d.id !== today)
      .map(d => ({
        date: d.id,
        completedCount: d.data().completedCount,
        totalTasks: d.data().totalTasks
      }));
    setEntries(data);
    setEntriesLoaded(true);
  } catch (err) {
    console.error('load entries failed:', err);
  }
};

const loadLeaderboard = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const today = getLocalDateString();
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    const users = await Promise.all(
      snapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const entriesRef = collection(db, 'users', userDoc.id, 'entries');
        const entriesSnap = await getDocs(entriesRef);
        
        let totalCompleted = 0;
        let weekCompleted = 0;
        let todayCompleted = 0;
        let perfectDays = 0;
        let totalDays = 0;
        
        entriesSnap.forEach(entry => {
          const data = entry.data();
          const entryDate = entry.id;
          
          // count for all time
          totalCompleted += data.completedCount || 0;
          totalDays++;
          
          if (data.completedCount === 9) perfectDays++;
          
          // count for this week
          if (entryDate >= weekAgo) {
            weekCompleted += data.completedCount || 0;
          }
          
          // count for today
          if (entryDate === today) {
            todayCompleted = data.completedCount || 0;
          }
        });
        
        return {
          uid: userDoc.id,
          username: userData.username || userData.email || 'anonymous',
          totalCompleted: leaderboardTab === 'today' ? todayCompleted : weekCompleted,
          perfectDays,
          totalDays,
          avgPerDay: totalDays > 0 ? (totalCompleted / totalDays).toFixed(1) : 0
        };
      })
    );
    
    // sort by total completed descending
    users.sort((a, b) => {
      if (b.totalCompleted !== a.totalCompleted) {
        return b.totalCompleted - a.totalCompleted;
      }
      return b.perfectDays - a.perfectDays;
    });
    
    setLeaderboardData(users);
    setLeaderboardLoaded(true);
    setLastLeaderboardUpdate(new Date());
  } catch (err) {
    console.error('leaderboard load failed:', err);
  }
};

// trigger load when viewing history
useEffect(() => {
  if (view === 'history' && user && !entriesLoaded) {
    loadEntries();
  }
}, [view, user, entriesLoaded]);

useEffect(() => {
  if (view === 'leaderboard' && user) {
    setLeaderboardLoaded(false);
    loadLeaderboard();
  }
}, [view, user, leaderboardTab]);

  // auth handlers
const handleSignIn = async () => {
  try {
    // use popup on desktop (faster), redirect on mobile (popups blocked)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      await signInWithRedirect(auth, googleProvider);
    } else {
      await signInWithPopup(auth, googleProvider);
    }
  } catch (err) {
    console.error('signin failed:', err);
  }
};



  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setView('today');
    } catch (err) {
      console.error('signout failed:', err);
    }
  };

  // friend functions
  const sendFriendRequest = async (targetEmail: string) => {
    if (!user || !targetEmail.trim()) return;
    
    try {
      // find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const snapshot = await getDocs(q);
      
      let targetUid: string | null = null;
      snapshot.forEach(d => {
        if (d.data().email === targetEmail.trim()) {
          targetUid = d.id;
        }
      });
      
      if (!targetUid) {
        alert('user not found');
        return;
      }
      
      if (targetUid === user.uid) {
        alert('cannot add yourself as friend');
        return;
      }
      
      // add to their pending requests
      const targetRef = doc(db, 'users', targetUid);
      const targetSnap = await getDoc(targetRef);
      const currentPending = targetSnap.exists() ? (targetSnap.data().pendingRequests || []) : [];
      
      if (currentPending.includes(user.uid)) {
        alert('request already sent');
        return;
      }
      
      await updateDoc(targetRef, {
        pendingRequests: [...currentPending, user.uid]
      });
      
      alert('friend request sent');
      setSearchEmail('');
    } catch (err) {
      console.error('friend request failed:', err);
      alert('failed to send request');
    }
  };
  
  const acceptFriendRequest = async (requesterUid: string) => {
    if (!user) return;
    
    try {
      // make it MUTUAL - both become friends
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        friends: [...friends, requesterUid],
        pendingRequests: pendingRequests.filter(uid => uid !== requesterUid)
      });
      
      // add me to their friends
      const theirRef = doc(db, 'users', requesterUid);
      const theirSnap = await getDoc(theirRef);
      const theirFriends = theirSnap.exists() ? (theirSnap.data().friends || []) : [];
      await updateDoc(theirRef, {
        friends: [...theirFriends, user.uid]
      });
      
      setFriends([...friends, requesterUid]);
      setPendingRequests(pendingRequests.filter(uid => uid !== requesterUid));
    } catch (err) {
      console.error('accept failed:', err);
    }
  };
  
  const removeFriend = async (friendUid: string) => {
    if (!user) return;
    
    try {
      // remove from my friends
      const myRef = doc(db, 'users', user.uid);
      await updateDoc(myRef, {
        friends: friends.filter(uid => uid !== friendUid)
      });
      
      // remove from their friends
      const theirRef = doc(db, 'users', friendUid);
      const theirSnap = await getDoc(theirRef);
      const theirFriends = theirSnap.exists() ? (theirSnap.data().friends || []) : [];
      await updateDoc(theirRef, {
        friends: theirFriends.filter((uid: string) => uid !== user.uid)
      });
      
      setFriends(friends.filter(uid => uid !== friendUid));
    } catch (err) {
      console.error('remove failed:', err);
    }
  };
  
  const viewFriendTasks = async (friendUid: string) => {
    if (!user) return;
    
    try {
      const today = getLocalDateString();
      const entryRef = doc(db, 'users', friendUid, 'entries', today);
      const entrySnap = await getDoc(entryRef);
      
      if (entrySnap.exists()) {
        setFriendTasks(entrySnap.data().tasks || []);
      } else {
        setFriendTasks([]);
      }
      
      setViewingFriend(friendUid);
      setView('friend');
    } catch (err) {
      console.error('failed to load friend tasks:', err);
    }
  };

  // load friend data when user loads
  useEffect(() => {
    if (!user) return;
    
    const loadFriendData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
      }
    };
    
    loadFriendData();
  }, [user]);
  
  // helper to get email from uid
  const getEmailFromUid = async (uid: string): Promise<string> => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const email = userSnap.exists() ? (userSnap.data().email || 'unknown') : 'unknown';
      console.log('[EMAIL LOOKUP]', { uid, exists: userSnap.exists(), email });
      return email;
    } catch (err) {
      console.error('[EMAIL LOOKUP ERROR]', uid, err);
      return 'unknown';
    }
  };

  const transitionToSection = (section: TimeSection | HomeSection) => {
    const newLayer = {
      id: section + '-' + Date.now(),
      bg: getBackgroundConfig(section),
      section: section,
      ready: false
    };
    setLayers(l => [...l, newLayer].slice(-2));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers(l => l.map(layer => layer.id === newLayer.id ? { ...layer, ready: true } : layer));
      });
    });
  };

  const handleHomeSelect = (id: HomeSection) => {
  if (id === homeSection) return;
  // start fade-out
  setContentVisible(false);
  // wait just long enough to start fading, then switch content midway
  setTimeout(() => setHomeSection(id), 150);
  // fade back in slightly after new content mounts
  setTimeout(() => setContentVisible(true), 200);
  transitionToSection(id);
};

  const handleTimeSelect = (section: TimeSection) => {
    if (section !== currentSection) {
      setManualOverride(section);
      transitionToSection(section);
    }
  };

  const resetToAuto = () => {
    setManualOverride(null);
    if (autoTimeSection !== currentSection) {
      transitionToSection(autoTimeSection);
    }
  };

const addRoutineTasks = (routineType: 'morning' | 'night') => {
  const routine = routineType === 'morning' ? morningRoutine : nightRoutine;
  const existingTitles = tasks.map(t => t.title);

  const newTasks = routine
    .filter(title => !existingTitles.includes(title))
    .map(title => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      title,
      completed: false,
      routineType
    }));

  if (newTasks.length) setTasks(prev => [...prev, ...newTasks]);
};
  
  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    if (newView === 'home') {
      transitionToSection(homeSection);
    } else if (newView === 'today') {
      setEditingDate(getLocalDateString()); // reset to actual today
      transitionToSection(manualOverride || autoTimeSection);
      if (user) {
        loadUserData(user.uid); // reload today's data
      }
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const prevCompletedRef = useRef(completedCount);

useEffect(() => {
  const today = getLocalDateString();
  
  // only fire if we JUST hit 9 (went from 8->9, not already at 9)
  if (
    completedCount === 9 && 
    prevCompletedRef.current === 8 &&
    tasks.length >= 9 && 
    editingDate === today
  ) {
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: Math.random(),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  }
  
  // update ref for next render
  prevCompletedRef.current = completedCount;
}, [completedCount, tasks.length, editingDate]);


  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, {
      id: Date.now().toString(),
      title: newTask,
      completed: false,
      routineType: null
    }]);
    setNewTask('');
  };



  const toggleTask = (id: string) => {
    setTasks(tasks.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const cx = 100, cy = 100, radius = 80;

  if (loading) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'white',
      fontFamily: '-apple-system, system-ui, sans-serif'
    }}>
      loading...
    </div>
  );
}

  return (
    <>
      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 8px rgba(244,63,94,0.3); }
          to { box-shadow: 0 0 24px rgba(244,63,94,0.9); }
        }
        h3 { margin:0 0 .25rem 0; font-size:1.1rem; font-weight:500; }
        p { margin:0 0 .5rem 0; font-size:.9rem; opacity:.9; }
      `}</style>

      <div className="min-h-screen relative">
       
        {/* backgrounds */}
        <div style={{ 
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: getBackgroundConfig(homeSection),
          transition: 'background 1s ease' }}>
          {layers.map(layer => (
            <div
              key={layer.id}
              style={{
                position: 'absolute',
                inset: 0,
                background: layer.bg,
                opacity: layer.ready ? 1 : 0,
                transition: 'opacity 1.2s ease'
              }}>
              <SvgLayer section={layer.section} />
            </div>
          ))}
        </div>

        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          color: 'white',
          fontFamily: '-apple-system, system-ui, sans-serif',
          overflow: 'auto',
          minHeight: '100vh',
          paddingLeft: "1rem",
          paddingRight: "1rem"
        }}>
          {/* header */}
          <header style={{ textAlign: 'left', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 200, margin: 0 }}>zoe</h1>
          </header>

          {/* nav tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', zIndex: '10' }}>
            {!user ? (
              <>
                <button
                  onClick={() => handleViewChange('home')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'home' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: view === 'home' ? 600 : 400,
                    transition: 'all 0.3s'
                  }}>
                  home
                </button>
                <button
                  onClick={() => handleViewChange('today')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'today' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: view === 'today' ? 600 : 400,
                    transition: 'all 0.3s'
                  }}>
                  today
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleViewChange('today')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'today' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: view === 'today' ? 600 : 400,
                    transition: 'all 0.3s'
                  }}>
                  today
                </button>
                <button
                  onClick={() => setView('history')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'history' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                  <Calendar size={20} />
                </button>
                <button
                  onClick={() => setView('leaderboard')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'leaderboard' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                  <Trophy size={20} />
                </button>
                <button
                  onClick={() => setView('settings')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: view === 'settings' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                  <Settings size={20} />
                </button>
              </>
            )}
          </div>

          {/* wheel nav */}
          {view === 'home' && (
            <div style={{ marginBottom: '2rem' }}>
              <svg width={cx * 2} height={cy * 2}>
                {homeSections.map((s, i) => {
                  const sliceAngle = 360 / homeSections.length;
                  const start = i * sliceAngle - 90, end = start + sliceAngle;
                  const path = describeSector(cx, cy, radius, start, end);
                  return (
                    <path
                      key={s.id}
                      d={path}
                      fill={homeSection === s.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
                      stroke="white"
                      strokeWidth={1}
                      onClick={() => handleHomeSelect(s.id)}
                      style={{ cursor: 'pointer', transition: 'fill .3s' }}
                    />
                  );
                })}
                {homeSections.map((s, i) => {
                  const sliceAngle = 360 / homeSections.length;
                  const angle = (i + 0.5) * sliceAngle - 90, rad = (Math.PI / 180) * angle;
                  const lx = cx + (radius / 1.6) * Math.cos(rad), ly = cy + (radius / 1.6) * Math.sin(rad);
                  return (
                    <text
                      key={s.id + '-label'}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="8"
                      style={{ pointerEvents: 'none', fontWeight: homeSection === s.id ? 600 : 400 }}>
                      {s.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}

          {view === 'today' &&  (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
              <svg width={cx * 1.2} height={cy * 1.2}>
                {timeSections.map((s, i) => {
                  const sliceAngle = 360 / timeSections.length;
                  const start = i * sliceAngle - 90, end = start + sliceAngle;
                  const path = describeSector(cx * 0.6, cy * 0.6, radius * 0.6, start, end);
                  return (
                    <path
                      key={s.id}
                      d={path}
                      fill={currentSection === s.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}
                      stroke="white"
                      strokeWidth={1}
                      onClick={() => handleTimeSelect(s.id)}
                      style={{ cursor: 'pointer', transition: 'fill .3s' }}
                    />
                  );
                })}
                {timeSections.map((s, i) => {
                  const sliceAngle = 360 / timeSections.length;
                  const angle = (i + 0.5) * sliceAngle - 90, rad = (Math.PI / 180) * angle;
                  const lx = cx * 0.6 + (radius * 0.6 / 1.7) * Math.cos(rad);
                  const ly = cy * 0.6 + (radius * 0.6 / 1.7) * Math.sin(rad);
                  return (
                    <text
                      key={s.id + '-label'}
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="7"
                      style={{ pointerEvents: 'none', fontWeight: currentSection === s.id ? 600 : 400 }}>
                      {s.label}
                    </text>
                  );
                })}
              </svg>
              {manualOverride && (
                <button
                  onClick={resetToAuto}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    backdropFilter: 'blur(8px)'
                  }}>
                  reset to auto
                </button>
              )}
            </div>
          )}

            {view === 'today' && !user && (
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '16px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                backdropFilter: 'blur(15px) saturate(140%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(0,0,0,0.25)',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <h2 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '1.5rem' }}>ready to start?</h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>sign in to track your tasks and unlock the full experience</p>
                <button
                  onClick={handleSignIn}
                  style={{
                    padding: '0.875rem 1.75rem',
                    background: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    backdropFilter: 'blur(10px)',
                    fontWeight: 500
                  }}>
                  sign in/sign up with google
                </button>
              </div>
          )}

          {/* content */}
          <div style={{
            width: '100%',
            maxWidth: '500px',
            opacity: view === 'home' ? (contentVisible ? 1 : 0) : 1,
            transition: 'opacity .4s ease'
          }}>
            {view === 'home' && homeSection === 'structure' && (
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Sun size={24} /> structure</h2>
                <Card><h3>daily frame</h3>
                  <ul>
                    <li>baseline = 9 tasks/day (from "do 9 things every day").</li>
                    <li>equal-height cards with editable start/end times.</li>
                    <li>drag-reorder only (no drag-adjust times).</li>
                    <li>supports both one-offs and recurring habits.</li>
                    <li>after 9 tasks, overdrive unlocks with unlimited extras for competitive grind.</li>
                  </ul>
                </Card>
                <Card><h3>visual layer</h3>
                  <ul>
                    <li>gradient background shifts in real-time: morning glow → afternoon light → sunset orange → night blue.</li>
                    <li>sun/moon/cloud markers track day phase.</li>
                    <li>local weather overlays (rain, snow, fog, sunshine) applied by default.</li>
                    <li>users can override/lock any aesthetic (e.g. permanent sunset, eternal night).</li>
                    <li>seasonal skins: blossoms, halloween fog, winter snow, etc.</li>
                    <li>leaderboard/profile visuals extend these effects for flex/status.</li>
                  </ul>
                </Card>
                <Card><h3>deadlines</h3>
                  <ul>
                    <li>for true hard cutoffs (flights, submissions, appointments).</li>
                    <li>missed = penalty points applied, but base points still granted.</li>
                    <li>on-time completion = bonus points.</li>
                    <li>bonus may scale by earliness (e.g. +10% one day early, +20% two+ days early).</li>
                  </ul>
                </Card>
                <Card><h3>urgency mechanics</h3>
                  <ul>
                    <li>tasks without deadlines gain urgency as they sit.</li>
                    <li>urgency pushes them visually upward with glow/animation.</li>
                    <li>urgency does not alter point values — only adds pressure.</li>
                    <li>power-ups like snooze/time freeze can pause urgency temporarily.</li>
                  </ul>
                </Card>
              </div>
            )}

            {view === 'home' && homeSection === 'progression' && (
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={24} /> progression</h2>
                <Card><h3>points & scoring</h3>
                  <ul>
                    <li>tasks scored small/medium/large with proportional points.</li>
                    <li>completion always yields base points (late/urgent doesn't matter).</li>
                    <li>daily score = base − penalties + streak multipliers + on-time bonuses.</li>
                    <li>xp accrues continuously for levels, cosmetic unlocks, and color themes.</li>
                    <li>streaks, overdrive, and deadlines feed into point calculation loops.</li>
                  </ul>
                </Card>
                <Card><h3>streaks</h3>
                  <ul>
                    <li>habit streaks boost points with multipliers.</li>
                    <li>perfect streak = maximum multiplier.</li>
                    <li>consistent but imperfect streaks (e.g. 5/7 days) keep steady bonuses.</li>
                    <li>streak breaks taper multiplier instead of resetting fully.</li>
                    <li>progressive multipliers: 1.2× after 1 week, 1.5× after 1 month, 2× after 3 months.</li>
                    <li>"second chance" power-up protects streaks from lapses.</li>
                  </ul>
                </Card>
                <Card overdrive><h3>overdrive</h3>
                  <ul>
                    <li>unlocks after completing 9 baseline tasks.</li>
                    <li>unlimited extras with rising combo multipliers.</li>
                    <li>ui shifts to neon "locked-in mode."</li>
                    <li>overdrive completions also auto-service penalty debt.</li>
                    <li>reinforces toxic productivity loop: grind more → score more → climb leaderboard.</li>
                  </ul>
                </Card>
                <Card><h3>progression loops</h3>
                  <ul>
                    <li>xp builds levels that unlock cosmetics, ui shifts, and titles.</li>
                    <li>prestige resets at milestones grant aura/title recognition.</li>
                    <li>infinite growth path designed without pay-to-win mechanics.</li>
                    <li>parallel loops: cosmetics, leaderboard, and prestige ensure long-term grind value.</li>
                  </ul>
                </Card>
              </div>
            )}

            {view === 'home' && homeSection === 'economy' && (
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Trophy size={24} /> economy</h2>
                <Card><h3>currencies</h3>
                  <ul>
                    <li>points (earned via tasks).</li>
                    <li>xp (for cosmetic/status levels).</li>
                    <li>penalty debt (ledger of missed deadlines).</li>
                    <li>optional streak tokens (earned at week/month habit tiers).</li>
                  </ul>
                </Card>
                <Card><h3>sources</h3>
                  <ul>
                    <li>base task completions.</li>
                    <li>on-time bonuses.</li>
                    <li>streak multipliers.</li>
                    <li>overdrive combos.</li>
                    <li>weekly recap bonuses.</li>
                    <li>milestones sometimes grant cosmetic tokens.</li>
                  </ul>
                </Card>
                <Card><h3>sinks</h3>
                  <ul>
                    <li>cosmetics: interface themes, avatars, badges, leaderboard borders, task-complete animations, seasonal skins, weather/time overrides, prestige auras.</li>
                    <li>power-ups: time freeze (pause urgency), double points (next task only), second chance (protect streak), deadline extension (grace period).</li>
                    <li>cosmetics priced high to keep grind valuable; power-ups consumable and capped daily.</li>
                  </ul>
                </Card>
                <Card urgent><h3>penalty economy</h3>
                  <ul>
                    <li>missed deadlines create penalty debt, but base task points remain.</li>
                    <li>penalty debt lowers leaderboard rank until cleared.</li>
                    <li>debt paid with points or auto-serviced via overdrive.</li>
                    <li>streak drops lower multipliers; on-time bonuses offset penalties.</li>
                    <li>push-pull tension: productivity clears debt and fuels rank.</li>
                  </ul>
                </Card>
                <Card><h3>anti-grind fatigue</h3>
                  <ul>
                    <li>most sinks are cosmetic, not functional.</li>
                    <li>power-ups capped per day to prevent exploit loops.</li>
                    <li>overdrive multipliers taper softly to prevent burnout spirals.</li>
                    <li>desirable cosmetics sustain engagement beyond raw point-chasing.</li>
                  </ul>
                </Card>
                <Card><h3>week loop sketch</h3>
                  <ul>
                    <li>mon: 9 done. 1 deadline missed → small debt; snooze applied.</li>
                    <li>tue: 9 on time; overdrive +3 tasks; combo climbs; bonuses stack.</li>
                    <li>wed: only 6 complete; snooze gone; debt grows; streak partly intact.</li>
                    <li>thu–sun: baseline + overdrive clears debt, farms cosmetics, maintains streak multipliers.</li>
                  </ul>
                </Card>
              </div>
            )}

            {view === 'home' && homeSection === 'workflows' && (
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Layers size={24} /> workflows</h2>
                <Card><h3>subtasks feed</h3>
                  <ul>
                    <li>projects split into subtasks that drop into daily frame.</li>
                    <li>subtasks inherit urgency/deadline rules.</li>
                    <li>encourages breaking large projects into grindable pieces.</li>
                  </ul>
                </Card>
                <Card><h3>milestones</h3>
                  <ul>
                    <li>subtasks roll up into milestones.</li>
                    <li>completion awards xp, cosmetics, and prestige tokens.</li>
                    <li>reinforces long-term project completion.</li>
                  </ul>
                </Card>
                <Card><h3>dependencies</h3>
                  <ul>
                    <li>tasks can lock behind others for sequencing.</li>
                    <li>completing prerequisites reveals subsequent steps.</li>
                    <li>keeps complex projects ordered without clutter.</li>
                  </ul>
                </Card>
                <Card><h3>habits vs one-offs</h3>
                  <ul>
                    <li>habits = recurring with streak mechanics.</li>
                    <li>one-offs = deadlines + urgency rules.</li>
                    <li>both flow together in same daily loop.</li>
                  </ul>
                </Card>
                <Card><h3>spillover</h3>
                  <ul>
                    <li>missed/recurring tasks spill forward under rules.</li>
                    <li>prevents hidden backlog creep.</li>
                    <li>still applies urgency/penalty logic.</li>
                  </ul>
                </Card>
              </div>
            )}

            {view === 'home' && homeSection === 'community' && (
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={24} /> community</h2>
                <Card><h3>leaderboards</h3>
                  <ul>
                    <li>rankings by speed (time-to-nine), consistency (weeks sustained), grind (total points), and streak tier.</li>
                    <li>tie-breakers: lowest penalty debt, most on-time bonuses, highest aura/title prestige.</li>
                    <li>separate daily/weekly/monthly boards reward both sprinters and grinders.</li>
                  </ul>
                </Card>
                <Card><h3>social pressure</h3>
                  <ul>
                    <li>opt-in lets friends see urgent items and streaks.</li>
                    <li>light accountability through shared visibility.</li>
                    <li>optional reactions/taunts (🔥 streak, ⏰ deadline hit).</li>
                    <li>encourages competitive motivation and toxic productivity loop.</li>
                  </ul>
                </Card>
                <Card><h3>fresh start</h3>
                  <ul>
                    <li>missing 3–5 days wipes penalties + streaks.</li>
                    <li>prevents punishment spirals.</li>
                    <li>eases re-entry and normalizes relapse.</li>
                    <li>keeps long-term engagement alive.</li>
                  </ul>
                </Card>
              </div>
            )}

            {view === 'today' && user && (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(15px) saturate(140%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(0,0,0,0.25)'
              }}>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
      {editingDate === getLocalDateString() ? (
        <>
          <button
            onClick={manualRollover}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: '#0f172a'
            }}>
            rollover
          </button>
          <button
            onClick={planTomorrow}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              cursor: 'pointer',
              color: '#0f172a'
            }}>
            plan tomorrow
          </button>
        </>
      ) : (
        <button
          onClick={backToToday}
          style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(0,0,0,0.05)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            color: '#0f172a'
          }}>
          back to today
        </button>
      )}
    </div>
                
              <div style={{ 
                color: '#0f172a', 
                marginBottom: '1rem', 
                fontSize: '0.9rem',
                fontWeight: editingDate !== getLocalDateString() ? 600 : 400,
                background: editingDate !== getLocalDateString() ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                padding: editingDate !== getLocalDateString() ? '0.5rem 0.75rem' : '0',
                borderRadius: '6px'
              }}>
                {editingDate === getLocalDateString() 
                  ? `completed: ${completedCount}/9`
                  : `editing ${editingDate} - completed: ${completedCount}/9`
                }
              </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addTask()}
                    placeholder="add a task..."
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                      fontSize: '0.9rem',
                      color: 'black'
                    }}
                  />
                  <button
                    onClick={addTask}
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#0f172a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}>
                    <Plus size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* morning tasks first */}
                  {tasks.filter(t => t.routineType === 'morning').map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        transition: 'background 0.2s'
                      }}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {task.completed ? (
                          <CheckCircle2 size={24} color="#10b981" />
                        ) : (
                          <Circle size={24} color="#cbd5e1" />
                        )}
                      </button>
                      <span style={{
                        flex: 1,
                        color: task.completed ? '#94a3b8' : '#0f172a',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        fontSize: '0.9rem'
                      }}>
                        {task.title}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                          (morning)
                        </span>
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}>
                        delete
                      </button>
                    </div>
                  ))}

                  {/* non-routine tasks in middle */}
                  {tasks.filter(t => !t.routineType).map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        transition: 'background 0.2s'
                      }}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {task.completed ? (
                          <CheckCircle2 size={24} color="#10b981" />
                        ) : (
                          <Circle size={24} color="#cbd5e1" />
                        )}
                      </button>
                      <span style={{
                        flex: 1,
                        color: task.completed ? '#94a3b8' : '#0f172a',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        fontSize: '0.9rem'
                      }}>
                        {task.title}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}>
                        delete
                      </button>
                    </div>
                  ))}

                  {/* night tasks last */}
                  {tasks.filter(t => t.routineType === 'night').map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        transition: 'background 0.2s'
                      }}>
                      <button
                        onClick={() => toggleTask(task.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {task.completed ? (
                          <CheckCircle2 size={24} color="#10b981" />
                        ) : (
                          <Circle size={24} color="#cbd5e1" />
                        )}
                      </button>
                      <span style={{
                        flex: 1,
                        color: task.completed ? '#94a3b8' : '#0f172a',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        fontSize: '0.9rem'
                      }}>
                        {task.title}
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                          (night)
                        </span>
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}>
                        delete
                      </button>
                    </div>
                  ))}
                </div>

                {tasks.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.9rem' }}>
                    no tasks yet. add one above.
                  </p>
                )}
              </div>
            )}

          {view === 'history' && (
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px) saturate(140%)',
              borderRadius: '16px',
              padding: '1.5rem'
            }}>
              <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>past entries</h2>
              {entries.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {entriesLoaded ? 'no entries yet.' : 'loading...'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {entries.map(e => (
                    <div 
                      key={e.date} 
                      onClick={() => viewPastEntry(e.date)}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(ev) => ev.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
                      onMouseLeave={(ev) => ev.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                    >
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{e.date}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        completed: {e.completedCount}/{e.totalTasks}
                        {e.completedCount === 9 && ' 🎉'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'leaderboard' && (
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px) saturate(140%)',
              borderRadius: '16px',
              padding: '1.5rem',
            }}>
              <h2 style={{ 
                color: '#1e293b', 
                marginBottom: '1rem', 
                marginTop: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={24} /> leaderboard
                </span>
                <button
                  onClick={() => {
                    setLeaderboardLoaded(false);
                    loadLeaderboard();
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(148, 163, 184, 0.15)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <RefreshCw size={16} />
                </button>
              </h2>
              
              {/* tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setLeaderboardTab('today')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: leaderboardTab === 'today' ? 'rgba(255,255,255,0.6)' : 'rgba(148, 163, 184, 0.15)',
                    color: leaderboardTab === 'today' ? '#1e293b' : '#64748b',
                    border: leaderboardTab === 'today' ? '1px solid rgba(148, 163, 184, 0.3)' : 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: leaderboardTab === 'today' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}>
                  today
                </button>
                <button
                  onClick={() => setLeaderboardTab('week')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: leaderboardTab === 'week' ? 'rgba(255,255,255,0.6)' : 'rgba(148, 163, 184, 0.15)',
                    color: leaderboardTab === 'week' ? '#1e293b' : '#64748b',
                    border: leaderboardTab === 'week' ? '1px solid rgba(148, 163, 184, 0.3)' : 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: leaderboardTab === 'week' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}>
                  this week
                </button>
              </div>

              {leaderboardData.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  {leaderboardLoaded ? 'no users yet' : 'loading...'}
                </p>
              ) : (
                <>
                  {/* podium - top 3 */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    {leaderboardData.slice(0, 3).map((u, idx) => {
                      const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                      const trophyColor = trophyColors[idx];
                      const isUser = u.uid === user?.uid;
                      const isWinner = idx === 0;
                      
                      return (
                        <div
                          key={u.uid}
                          style={{
                            background: isWinner 
                              ? 'rgba(255, 253, 245, 0.95)'  // warm cream instead of yellow tint
                              : 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(15px) saturate(140%)',
                            borderRadius: '16px',
                            padding: isWinner ? '1.25rem' : '1rem',
                            marginBottom: '0.75rem',
                            boxShadow: isWinner
                              ? '0 12px 40px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.6)' 
                              : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 16px rgba(100, 116, 139, 0.15)',
                            border: isWinner ? '2px solid rgba(255, 215, 0, 0.4)' : '1px solid rgba(148, 163, 184, 0.2)',
                            transform: isWinner ? 'scale(1.03)' : 'scale(1)',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                          {isWinner && (
                            <>
                              <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                width: '4px',
                                height: '4px',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,215,0,0.4) 50%, transparent 70%)',
                                borderRadius: '50%',
                                boxShadow: '0 0 8px rgba(255,215,0,0.6)',
                                animation: 'pulse 3s ease-in-out infinite'
                              }} />
                              <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '25px',
                                width: '3px',
                                height: '3px',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.3) 50%, transparent 70%)',
                                borderRadius: '50%',
                                boxShadow: '0 0 6px rgba(255,215,0,0.5)',
                                animation: 'pulse 3s ease-in-out infinite',
                                animationDelay: '0.5s'
                              }} />
                              <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                left: '15px',
                                width: '3px',
                                height: '3px',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,215,0,0.3) 50%, transparent 70%)',
                                borderRadius: '50%',
                                boxShadow: '0 0 6px rgba(255,215,0,0.5)',
                                animation: 'pulse 3s ease-in-out infinite',
                                animationDelay: '1s'
                              }} />
                            </>
                          )}
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
                            <div style={{
                              width: isWinner ? '56px' : '48px',
                              height: isWinner ? '56px' : '48px',
                              borderRadius: '50%',
                              background: isWinner 
                                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 193, 7, 0.15))'
                                : 'rgba(148, 163, 184, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: isWinner ? '2px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(148, 163, 184, 0.15)',
                              boxShadow: isWinner ? '0 4px 12px rgba(255, 215, 0, 0.3)' : 'none'
                            }}>
                              <Trophy 
                                size={isWinner ? 32 : 28} 
                                color={trophyColor} 
                                fill={trophyColor} 
                                strokeWidth={1.5} 
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: isWinner ? 800 : 700, 
                                color: '#1e293b', 
                                fontSize: isWinner ? '1.1rem' : '1rem',
                                letterSpacing: isWinner ? '-0.02em' : 'normal'
                              }}>
                                {u.username}
                                {isUser && ' (you)'}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {u.totalCompleted} tasks • {u.perfectDays}🔥 perfect days
                              </div>
                              <div style={{
                                marginTop: '0.5rem',
                                height: isWinner ? '8px' : '6px',
                                background: 'rgba(148, 163, 184, 0.15)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min((u.totalCompleted / (leaderboardData[0]?.totalCompleted || 1)) * 100, 100)}%`,
                                  background: isWinner
                                    ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                                    : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease',
                                  boxShadow: isWinner ? '0 2px 8px rgba(255, 215, 0, 0.4)' : 'none'
                                }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* rest of leaderboard */}
                  {leaderboardData.length > 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {leaderboardData.slice(3).map((u, idx) => {
                        const actualIdx = idx + 3;
                        const isUser = u.uid === user?.uid;
                        const maxTasks = leaderboardData[0]?.totalCompleted || 1;
                        
                        return (
                          <div
                            key={u.uid}
                            style={{
                              padding: '0.75rem',
                              background: 'rgba(148, 163, 184, 0.08)',
                              borderRadius: '8px',
                              border: '1px solid rgba(148, 163, 184, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'all 0.2s'
                            }}>
                            <div style={{
                              minWidth: '32px',
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#64748b',
                              fontSize: '0.9rem',
                              background: 'rgba(148, 163, 184, 0.15)',
                              borderRadius: '6px'
                            }}>
                              #{actualIdx + 1}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                                {u.username}
                                {isUser && ' (you)'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {u.totalCompleted} tasks • {u.perfectDays}🔥 perfect • {u.avgPerDay} avg/day
                              </div>
                              <div style={{
                                marginTop: '0.5rem',
                                height: '4px',
                                background: 'rgba(148, 163, 184, 0.15)',
                                borderRadius: '2px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${(u.totalCompleted / maxTasks) * 100}%`,
                                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                  borderRadius: '2px',
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                              {actualIdx > 0 && (
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                  {leaderboardData[0].totalCompleted - u.totalCompleted} behind #1
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {lastLeaderboardUpdate && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.5rem',
                      background: 'rgba(148, 163, 184, 0.08)',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      color: '#94a3b8',
                      textAlign: 'center'
                    }}>
                      last updated {Math.floor((Date.now() - lastLeaderboardUpdate.getTime()) / 60000)} mins ago
                    </div>
                  )}
                </>
              )}
            </div>
          )}     


          {view === 'settings' && (
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px) saturate(140%)',
              borderRadius: '16px',
              padding: '1.5rem'
            }}>
              <h2 style={{ color: '#0f172a', marginBottom: '1rem', marginTop: '0' }}>routines</h2>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>morning routine</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {morningRoutine.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        transition: 'background 0.2s'
                      }}>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          typingRef.current = true;
                          const updated = [...morningRoutine];
                          updated[i] = e.target.value;
                          setMorningRoutine(updated);
                          clearTimeout((window as any)._routineReset);
                          (window as any)._routineReset = setTimeout(() => {
                            typingRef.current = false;
                          }, 2000);
                        }}
                        style={{
                          flex: 1,
                          padding: '0',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '0.9rem',
                          color: '#0f172a'
                        }}
                      />
                      <button
                        onClick={async () => {
                          const updated = morningRoutine.filter((_, idx) => idx !== i);
                          setMorningRoutine(updated);
                          
                          // save to firestore immediately
                          if (user) {
                            await updateDoc(doc(db, 'users', user.uid), {
                              morningRoutine: updated
                            });
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}>
                        delete
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setMorningRoutine([...morningRoutine, ''])}
                  style={{
                    marginTop: '0.5rem',
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%'
                  }}>
                  + add task
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>night routine</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {nightRoutine.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.02)',
                        transition: 'background 0.2s'
                      }}>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          typingRef.current = true;
                          const updated = [...nightRoutine];
                          updated[i] = e.target.value;
                          setNightRoutine(updated);
                          clearTimeout((window as any)._routineReset);
                          (window as any)._routineReset = setTimeout(() => {
                            typingRef.current = false;
                          }, 2000);
                        }}
                        style={{
                          flex: 1,
                          padding: '0',
                          border: 'none',
                          background: 'transparent',
                          outline: 'none',
                          fontSize: '0.9rem',
                          color: '#0f172a'
                        }}
                      />
                      <button
                        onClick={async () => {
                          const updated = nightRoutine.filter((_, idx) => idx !== i);
                          setNightRoutine(updated);
                          
                          // save to firestore immediately
                          if (user) {
                            await updateDoc(doc(db, 'users', user.uid), {
                              nightRoutine: updated
                            });
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          opacity: 0.6,
                          transition: 'opacity 0.2s'
                        }}>
                        delete
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setNightRoutine([...nightRoutine, ''])}
                  style={{
                    marginTop: '0.5rem',
                    background: 'rgba(0,0,0,0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    width: '100%'
                  }}>
                  + add task
                </button>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.9rem' }}>friends</h3>
                
                {/* search for users */}
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="email"
                    placeholder="search by email"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <button
                    onClick={() => sendFriendRequest(searchEmail)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}>
                    send friend request
                  </button>
                </div>

                {/* pending requests */}
                {pendingRequests.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      friend requests ({pendingRequests.length})
                    </div>
                    {pendingRequests.map(uid => (
                      <PendingRequest key={uid} uid={uid} onAccept={acceptFriendRequest} getEmail={getEmailFromUid} />
                    ))}
                  </div>
                )}

                {/* my friends */}
                {friends.length > 0 && (
                  <div style={{ marginBottom: '1rem', color: '#64748b' }}>
                    <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      my friends ({friends.length})
                    </div>
                    {friends.map(uid => (
                      <FriendItem 
                        key={uid} 
                        uid={uid} 
                        onRemove={removeFriend} 
                        onView={viewFriendTasks}
                        getEmail={getEmailFromUid} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  logged in as: {user?.email || 'loading...'}
                </p>
                <button 
                  onClick={handleSignOut}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                  <LogOut size={16} />
                  sign out
                </button>
              </div>
            </div>
          )}

          {view === 'friend' && (
            <div style={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(15px) saturate(140%)',
              borderRadius: '16px',
              padding: '1.5rem'
            }}>
              <button
                onClick={() => {
                  setView('settings');
                  setViewingFriend(null);
                  setFriendTasks([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                ← back to settings
              </button>
              
              <h2 style={{ color: '#0f172a', marginBottom: '1rem', marginTop: 0 }}>
                friend's tasks
              </h2>

              {friendTasks.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>no tasks for today</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {friendTasks.map(task => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: '8px'
                      }}>
                      {task.completed ? (
                        <CheckCircle2 size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                      ) : (
                        <Circle size={20} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      )}
                      <span style={{
                        flex: 1,
                        color: task.completed ? '#64748b' : '#0f172a',
                        textDecoration: task.completed ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showUsernamePrompt && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}>
                <h2 style={{ color: '#1e293b', marginTop: 0, marginBottom: '0.5rem' }}>choose a username</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  this will be displayed on the leaderboard
                </p>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="enter username..."
                  maxLength={20}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={async () => {
                    if (!usernameInput.trim() || !user) return;
                    try {
                      await updateDoc(doc(db, 'users', user.uid), {
                        username: usernameInput.trim()
                      });
                      setShowUsernamePrompt(false);
                      setUsernameInput('');
                    } catch (err) {
                      console.error('failed to save username:', err);
                    }
                  }}
                  disabled={!usernameInput.trim()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: usernameInput.trim() ? '#1e293b' : '#cbd5e1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: usernameInput.trim() ? 'pointer' : 'not-allowed'
                  }}>
                  save
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}