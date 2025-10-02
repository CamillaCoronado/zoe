import { useState, useMemo, useEffect } from "react"
import {
  Sun, TrendingUp, Trophy, Layers, Users
} from "lucide-react"

type Section = { id: string; label: string }

const sections: Section[] = [
  { id: "structure", label: "structure" },
  { id: "progression", label: "progression" },
  { id: "economy", label: "economy" },
  { id: "workflows", label: "workflows" },
  { id: "community", label: "community" }
]

function describeSector(cx:number, cy:number, r:number, startAngle:number, endAngle:number):string {
  const rad = (deg:number) => (Math.PI/180)*deg
  const x1 = cx + r * Math.cos(rad(startAngle))
  const y1 = cy + r * Math.sin(rad(startAngle))
  const x2 = cx + r * Math.cos(rad(endAngle))
  const y2 = cy + r * Math.sin(rad(endAngle))
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

export default function App() {
  const [selected, setSelected] = useState<string>(sections[0].id)
  const [contentVisible, setContentVisible] = useState<boolean>(true)
  const [layers, setLayers] = useState<{id:string; bg:string; section:string; ready:boolean}[]>([])

  const gradients: Record<string,string> = {
    structure:   "linear-gradient(to bottom, #0f172a, #1e3a8a)",
    community:   "linear-gradient(to bottom, #0f172a, #1e3a8a)",
    progression: "linear-gradient(to bottom, #f59f00, #f783ac)",
    economy:     "linear-gradient(to bottom, #4dabf7, #228be6)",
    workflows:   "linear-gradient(to bottom, #ff922b, #d6336c)",
  }

  const handleSelect = (id:string) => {
    if (id !== selected) {
      setContentVisible(false)
      setTimeout(() => {
        setSelected(id)
        setContentVisible(true)
      }, 400)
    }
  }

  // push a new layer every time selected changes
  useEffect(()=>{
    const newLayer = {id: selected+"-"+Date.now(), bg: gradients[selected], section:selected, ready:false}
    setLayers(l => [...l, newLayer].slice(-2))
    // force opacity transition by delaying ready flag
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{
        setLayers(l => l.map(layer => layer.id === newLayer.id ? {...layer, ready:true} : layer))
      })
    })
  },[selected])

  const cx = 100, cy = 100, radius = 80, sliceAngle = 360 / sections.length

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

      {/* backgrounds */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
        {layers.map((layer,i)=>(
          <div key={layer.id}
            style={{
              position:"absolute",inset:0,
              background: layer.bg,
              opacity: layer.ready ? 1 : 0,
              transition:"opacity 1.2s ease"
            }}>
            <SvgLayer section={layer.section}/>
          </div>
        ))}
      </div>

      {/* main */}
      <div style={{
        position:"relative",zIndex:2,minHeight:"100vh",width:"100vw",
        display:"flex",flexDirection:"column",alignItems:"center",
        color:"white",fontFamily:"-apple-system, system-ui, sans-serif",
        overflow:"auto",padding:"1rem"
      }}>
        <header style={{ textAlign:"center", display:"flex" }}>
          <h1 style={{ fontSize:"3rem",fontWeight:200,margin:0, color:"#FFFFFF" }}>zoe</h1>
        </header>

        {/* svg nav */}
        <div>
          <svg width={cx*2} height={cy*2}>
            {sections.map((s,i)=>{
              const start=i*sliceAngle-90,end=start+sliceAngle
              const path=describeSector(cx,cy,radius,start,end)
              return (
                <path key={s.id} d={path}
                  fill={selected===s.id?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}
                  stroke="white" strokeWidth={1}
                  onClick={()=>handleSelect(s.id)}
                  style={{cursor:"pointer",transition:"fill .3s"}}/>
              )
            })}
            {sections.map((s,i)=>{
              const angle=(i+.5)*sliceAngle-90, rad=(Math.PI/180)*angle
              const lx=cx+(radius/1.6)*Math.cos(rad), ly=cy+(radius/1.6)*Math.sin(rad)
              return (
                <text key={s.id+"-label"} x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="8"
                  style={{pointerEvents:"none",fontWeight:selected===s.id?600:400}}>
                  {s.label}
                </text>
              )
            })}
          </svg>
        </div>

        {/* content */}
        <div style={{
          width:"80%",maxWidth:"500px",marginTop:"1rem",
          opacity:contentVisible?1:0,transition:"opacity .4s ease"
        }}>
          {selected==="structure" && (
            <div>
              <h2><Sun size={24}/> structure</h2>
              <Card><h3>daily frame</h3><p>9 tasks/day, equal-height cards, editable times. drag-reorder only. habits and one-offs supported.</p></Card>
              <Card><h3>visual layer</h3><p>background gradient morning→night. sun/noon/moon markers. future: real-time weather overlay. vibe: delightful, not sterile.</p></Card>
              <Card><h3>deadlines</h3><p>true hard cutoffs only. missed ⇒ 0 pts + penalty. examples: flights, submissions, appointments.</p></Card>
            </div>
          )}
          {selected==="progression" && (
            <div>
              <h2><TrendingUp size={24}/> progression</h2>
              <Card><h3>points & scoring</h3><p>tasks scored small/med/big. full base points whether on-time or late. daily score = base − penalties + streak multipliers. xp accrues for levels + color shifts.</p></Card>
              <Card><h3>streaks</h3><p>perfect streak = max multiplier. consistent streak (e.g. 5/7 days) keeps steady bonus. breaks taper, not erase.</p></Card>
              <Card overdrive><h3>overdrive</h3><p>after 9/9 tasks, unlimited extras unlock. rising combo multiplier. ui shifts to neon "locked-in mode."</p></Card>
              <Card><h3>progression loops</h3><p>xp builds levels for cosmetic upgrades. prestige resets at milestones grant aura/title. growth is infinite but non-pay-to-win.</p></Card>
            </div>
          )}
          {selected==="economy" && (
            <div>
              <h2><Trophy size={24}/> economy</h2>
              <Card><h3>currencies</h3><p>points/xp (earned). penalty debt (lateness ledger). optional streak tokens at week/month tiers.</p></Card>
              <Card><h3>sources</h3><p>base task points, streak multipliers, overdrive combos, weekly recap bonuses.</p></Card>
              <Card><h3>sinks</h3><p>cosmetics: themes, icons, urgency animations, weather skins. status tiers. power-ups: snooze (delay urgency once), shield (block penalty tick). mostly cosmetic/status sinks.</p></Card>
              <Card urgent><h3>penalty economy</h3><p>lateness builds debt until cleared. tasks still give base points. debt lowers daily/weekly rank until repaid. paydown via allocating points or overdrive auto-service.</p></Card>
              <Card><h3>anti-grind fatigue</h3><p>most sinks cosmetic. power-ups capped/day. overdrive multipliers taper softly if abused.</p></Card>
              <Card><h3>week loop sketch</h3>
                <p>mon: 9 done. 1 late → small debt; snooze for tue.<br/>
                   tue: 9 early; enter overdrive +3 tasks; combo climbs.<br/>
                   wed: only 6; snooze used; debt grows but ok.<br/>
                   thu–sun: baseline + overdrive to service debt, farm cosmetics, keep streaks.</p>
              </Card>
            </div>
          )}
          {selected==="workflows" && (
            <div>
              <h2><Layers size={24}/> workflows</h2>
              <Card><h3>subtasks feed</h3><p>projects auto-split into subtasks that feed into the daily frame.</p></Card>
              <Card><h3>milestones</h3><p>subtasks roll up into milestones. completion yields xp + cosmetics.</p></Card>
              <Card><h3>dependencies</h3><p>tasks can unlock or gate others. sequencing makes long projects manageable and ordered.</p></Card>
              <Card><h3>habits vs one-offs</h3><p>recurring habits get streak mechanics, one-offs obey deadlines. workflows integrate both types cleanly.</p></Card>
              <Card><h3>spillover</h3><p>rules for recurring or missed tasks carrying forward across days. avoids hidden backlog creep.</p></Card>
            </div>
          )}
          {selected==="community" && (
            <div>
              <h2><Users size={24}/> community</h2>
              <Card><h3>leaderboards</h3><p>rankings across speed (time-to-nine), consistency (weeks-of-nine), and grind (total points). tie-breakers: lower penalty debt, higher streak tier.</p></Card>
              <Card><h3>social pressure</h3><p>opt-in setting allows friends to see urgent items. light accountability through shared visibility.</p></Card>
              <Card><h3>fresh start</h3><p>missing 3–5 days wipes penalties + streaks. avoids punishment spirals, eases re-entry, normalizes relapse.</p></Card>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SvgLayer({section}:{section:string}) {
  // memoize starfields
  const makeStars = (n:number, maxY=100, minO=0.3, maxO=1) =>
    Array.from({length:n}).map((_,i)=>({
      key: i,
      cx: Math.random()*100,
      cy: Math.random()*maxY,
      r: Math.random()*1+0.5,
      o: Math.random()*(maxO-minO)+minO
    }))

  const starsStructure = useMemo(()=>makeStars(100),[])
  const starsCommunity = useMemo(()=>makeStars(120),[])
  const starsProgression = useMemo(()=>makeStars(30,40,0.2,0.6),[])
  const starsWorkflows  = useMemo(()=>makeStars(40,60,0.2,0.6),[])

  return (
    <svg width="100%" height="100%" style={{position:"absolute",inset:0}}>
      <defs>
        <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#1e3a8a"/>
        </linearGradient>
        <linearGradient id="moonGradient" x1="0" y1="0" x2="0" y2="100%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a"/>
          <stop offset="100%" stopColor="#1e3a8a"/>
        </linearGradient>
      </defs>

      {section==="structure" && starsStructure.map(s=>(
        <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o}/>
      ))}

      {section==="community" && (
        <>
          <circle cx="80%" cy="20%" r="40" fill="white"/>
          <circle cx="85%" cy="20%" r="40" fill="url(#moonGradient)"/>
          {starsCommunity.map(s=>(
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o}/>
          ))}
        </>
      )}

      {section==="progression" && (
        <>
          <circle cx="50%" cy="105%" r="90" fill="orange" opacity="0.6"/>
          {starsProgression.map(s=>(
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o}/>
          ))}
        </>
      )}

      {section==="economy" && (
        <>
          <path d="M60 100 Q 55 80 75 80 Q 85 60 105 80 Q 125 80 130 95 Q 140 110 120 115 L60 115 Z" fill="white" opacity="0.4"/>
          <path d="M200 140 Q 190 120 210 120 Q 225 100 245 120 Q 265 120 270 135 Q 280 150 260 155 L200 155 Z" fill="white" opacity="0.4"/>
        </>
      )}

      {section==="workflows" && (
        <>
          <path d="M100 80 Q 95 65 115 65 Q 125 50 145 65 Q 165 65 170 75 Q 180 90 160 95 L100 95 Z" fill="white" opacity="0.3"/>
          <path d="M250 130 Q 240 115 260 115 Q 275 100 295 115 Q 315 115 320 125 Q 330 140 310 145 L250 145 Z" fill="white" opacity="0.3"/>
          {starsWorkflows.map(s=>(
            <circle key={s.key} cx={`${s.cx}%`} cy={`${s.cy}%`} r={s.r} fill="white" opacity={s.o}/>
          ))}
        </>
      )}
    </svg>
  )
}

type CardProps = { children:React.ReactNode; urgent?:boolean; overdrive?:boolean }
function Card({children,urgent,overdrive}:CardProps){
  let style:React.CSSProperties={
    background:"rgba(255,255,255,0.1)",borderRadius:"16px",
    padding:"1rem 1.25rem",marginBottom:".75rem",
    backdropFilter:"blur(15px) saturate(140%)",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.25),0 6px 20px rgba(0,0,0,0.25)"
  }
  if(urgent) style={...style,animation:"pulse 2s infinite alternate",boxShadow:"0 0 16px rgba(244,63,94,0.6)"}
  if(overdrive) style={...style,background:"rgba(236,72,153,0.2)",boxShadow:"0 0 25px rgba(236,72,153,0.8)"}
  return <div style={style}>{children}</div>
}