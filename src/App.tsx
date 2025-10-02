import { useState } from "react"
import {
  Sun, Layers, Trophy, Users, CalendarDays, Flame, Shield
} from "lucide-react"

const sections = [
  { id: "mechanics", label: "mechanics" },
  { id: "projects", label: "projects" },
  { id: "economy", label: "economy" },
  { id: "community", label: "community" },
  { id: "reset", label: "reset" }
]

export default function App() {
  const [selected, setSelected] = useState(sections[0].id)
  const [prevSelected, setPrevSelected] = useState(sections[0].id)
  const [contentVisible, setContentVisible] = useState(true)

  const gradients = [
    "linear-gradient(to bottom, #0f172a, #1e3a8a)",
    "linear-gradient(to bottom, #f59f00, #f783ac)",
    "linear-gradient(to bottom, #4dabf7, #228be6)",
    "linear-gradient(to bottom, #ff922b, #d6336c)",
    "linear-gradient(to bottom, #0f172a, #1e3a8a)"
  ]
  
  const currentBg = gradients[sections.findIndex(s => s.id === selected)]
  const prevBg = gradients[sections.findIndex(s => s.id === prevSelected)]

  const handleSelect = (id) => {
    if (id !== selected) {
      setContentVisible(false)
      setPrevSelected(selected)
      setTimeout(() => {
        setSelected(id)
        setContentVisible(true)
        setTimeout(() => {
          setPrevSelected(id)
        }, 1200)
      }, 400)
    }
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: prevBg,
        zIndex: 0
      }} />
      <div 
        key={selected}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: currentBg,
          animation: 'fadeIn 1.2s ease',
          zIndex: 1,
          pointerEvents: 'none'
        }} 
      />
      <div style={{ 
        position: 'relative',
        zIndex: 2,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'white',
        fontFamily: '-apple-system, system-ui, sans-serif',
        overflow: 'auto',
        padding: '1rem'
      }}>
        <header style={{ textAlign: 'center', margin: '1rem 0' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 200, margin: 0 }}>zoe</h1>
          <p style={{ fontSize: '1rem', opacity: 0.85, margin: '0.25rem 0 0' }}>
            competitive urgency-driven productivity • community for everyone
          </p>
        </header>

        <div style={{ 
          position: 'relative',
          width: '300px',
          height: '300px',
          margin: '2rem 0'
        }}>
          {sections.map((s, i) => {
            const angle = (i / sections.length) * 2 * Math.PI - Math.PI / 2
            const radius = 100
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`,
                  background: selected === s.id 
                    ? 'rgba(255,255,255,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: selected === s.id ? 600 : 400
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transition = 'transform 0.15s ease'
                  e.currentTarget.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(0.92)`
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  e.currentTarget.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  e.currentTarget.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1)`
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>

        <div style={{ 
          width: '80%', 
          maxWidth: '500px', 
          marginTop: '1rem',
          opacity: contentVisible ? 1 : 0,
          transition: 'opacity 0.4s ease'
        }}>
          {selected === "mechanics" && (
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sun size={24} /> mechanics
              </h2>
              <Card>
                <h3>daily frame</h3>
                <p>9 slots/day, equal height, reorder only. forces balance + prioritization.</p>
              </Card>
              <Card urgent>
                <h3>urgency</h3>
                <p>late tasks climb + pulse. urgency-lock forbids adding new tasks until cleared.</p>
              </Card>
              <Card>
                <h3>deadlines</h3>
                <p>hard cutoffs = 0 pts + penalty. soft ones escalate urgency.</p>
              </Card>
            </div>
          )}

          {selected === "projects" && (
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Layers size={24} /> projects
              </h2>
              <Card>
                <h3>subtasks feed</h3>
                <p>projects split into subtasks that auto-feed daily slots. completion = milestone xp + cosmetics.</p>
              </Card>
            </div>
          )}

          {selected === "economy" && (
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Trophy size={24} /> economy
              </h2>
              <Card>
                <h3>points + penalties</h3>
                <p>small=5xp, medium=10xp, large=20xp. full credit even if late, but lateness adds penalty debt.</p>
              </Card>
              <Card>
                <h3><Shield size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> streaks</h3>
                <p>perfect streak = max bonus. partial streaks rewarded. long inactivity resets fresh.</p>
              </Card>
              <Card overdrive>
                <h3><Flame size={18} style={{ display: 'inline', verticalAlign: 'middle' }} /> overdrive</h3>
                <p>after 9/9, unlock unlimited tasks. combo multipliers scale, neon locked-in mode.</p>
              </Card>
            </div>
          )}

          {selected === "community" && (
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Users size={24} /> community
              </h2>
              <Card leaderboard>
                <h3>leaderboard</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0 0' }}>
                  {[
                    { name: 'alice', xp: '1240xp' },
                    { name: 'camilla', xp: '1170xp' },
                    { name: 'ravi', xp: '980xp' }
                  ].map(u => (
                    <li key={u.name} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.25rem 0',
                      fontSize: '0.9rem',
                      borderBottom: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      <span>{u.name}</span>
                      <span>{u.xp}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {selected === "reset" && (
            <div>
              <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CalendarDays size={24} /> reset
              </h2>
              <Card>
                <h3>fresh start</h3>
                <p>missing 3–5 days wipes penalties + streaks. reset avoids punishment spiral + eases re-entry.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Card({ children, urgent, overdrive }) {
  const baseStyle = {
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
    backdropFilter: 'blur(15px) saturate(140%)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 6px 20px rgba(0,0,0,0.25)'
  }

  let style = { ...baseStyle }
  
  if (urgent) {
    style = {
      ...style,
      animation: 'pulse 2s infinite alternate',
      boxShadow: '0 0 16px rgba(244,63,94,0.6)'
    }
  }
  
  if (overdrive) {
    style = {
      ...style,
      background: 'rgba(236,72,153,0.2)',
      boxShadow: '0 0 25px rgba(236,72,153,0.8)'
    }
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          from { box-shadow: 0 0 8px rgba(244,63,94,0.3); }
          to { box-shadow: 0 0 24px rgba(244,63,94,0.9); }
        }
        h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          font-weight: 500;
        }
        p {
          margin: 0;
          font-size: 0.9rem;
          opacity: 0.85;
        }
      `}</style>
      <div style={style}>
        {children}
      </div>
    </>
  )
}