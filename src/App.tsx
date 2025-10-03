import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Plus, Calendar, Settings, LogOut, Sun, TrendingUp, Trophy, Layers, Users } from 'lucide-react';

// mock firebase stuff
const mockUser = { uid: 'user123', email: 'you@example.com' };

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

const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            backgroundColor: ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'][i % 5],
            animationDelay: `${Math.random() * 0.5}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
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

export default function DailyNine() {
  const [view, setView] = useState<'home' | 'today' | 'history' | 'settings'>('home');
  const [homeSection, setHomeSection] = useState<HomeSection>('structure');
  const [autoTimeSection, setAutoTimeSection] = useState<TimeSection>(getTimeSection());
  const [manualOverride, setManualOverride] = useState<TimeSection | null>(null);
  const [layers, setLayers] = useState<{ id: string; bg: string; section: TimeSection | HomeSection; ready: boolean }[]>([]);
  const [contentVisible, setContentVisible] = useState<boolean>(true);
  const [tasks, setTasks] = useState([
    { id: '1', title: 'morning meditation', completed: false, routineType: 'morning' },
    { id: '2', title: 'check email', completed: false, routineType: null },
    { id: '3', title: 'deep work block', completed: false, routineType: null }
  ]);
  const [newTask, setNewTask] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [morningRoutine] = useState(['morning meditation', 'breakfast', 'plan day']);
  const [nightRoutine] = useState(['review day', 'read', 'prep tomorrow']);

  const currentSection = view === 'home' ? homeSection : (manualOverride || autoTimeSection);

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

  // initial layer
  useEffect(() => {
    const initialSection = view === 'home' ? homeSection : (manualOverride || autoTimeSection);
    const initialLayer = {
      id: initialSection + '-' + Date.now(),
      bg: getBackgroundConfig(initialSection),
      section: initialSection,
      ready: false
    };
    setLayers([initialLayer]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers(l => l.map(layer => layer.id === initialLayer.id ? { ...layer, ready: true } : layer));
      });
    });
  }, []);

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
    if (id !== homeSection) {
      setContentVisible(false);
      setTimeout(() => {
        setHomeSection(id);
        setContentVisible(true);
      }, 400);
      transitionToSection(id);
    }
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

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    if (newView === 'home') {
      transitionToSection(homeSection);
    } else if (newView === 'today') {
      transitionToSection(manualOverride || autoTimeSection);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  useEffect(() => {
    if (completedCount === 9 && tasks.length >= 9) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [completedCount, tasks.length]);

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
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
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

        <Confetti show={showConfetti} />

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

          {view === 'today' && (
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

            {view === 'today' && (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(15px) saturate(140%)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(0,0,0,0.25)'
              }}>
                <div style={{ color: '#0f172a', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  completed: {completedCount}/9
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
                  {tasks.map(task => (
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
                        {task.routineType && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                            ({task.routineType})
                          </span>
                        )}
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
                <p style={{ color: '#64748b', marginBottom: '1rem' }}>mock: calendar view would go here</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>2025-10-01</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>completed: 7/9</div>
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>2025-09-30</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>completed: 9/9 🎉</div>
                  </div>
                </div>
              </div>
            )}

            {view === 'settings' && (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(15px) saturate(140%)',
                borderRadius: '16px',
                padding: '1.5rem'
              }}>
                <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>routines</h2>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>morning routine</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    {morningRoutine.map((item, i) => (
                      <div key={i}>• {item}</div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>night routine</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                    {nightRoutine.map((item, i) => (
                      <div key={i}>• {item}</div>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>
                    logged in as: {mockUser.email}
                  </p>
                  <button style={{
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
                    sign out (mock)
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