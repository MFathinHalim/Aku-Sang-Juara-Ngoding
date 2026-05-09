import { useState, useEffect, useRef } from 'react';
import { Terminal, Keyboard, Coffee, User, Bot, Brain, Server, Bug, Sparkles, LogIn, LogOut, Code2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';

const CODE_SNIPPET = `import { useState, useEffect, useCallback } from 'react';
import { createServer } from 'http';
import { Database } from '@services/db';

/**
 * Initiates the primary microservice cluster
 * Author: Lead Architect
 */
export function ApplicationCluster() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  
  useEffect(() => {
    async function initializeSystem() {
      try {
        console.log("Booting up Quantum Nodes...");
        const response = await fetch('/api/v2/core-status');
        const sysStats = await response.json();
        
        // Ensure high availability
        if (sysStats.load > 90) {
          await scaleKubernetesNodes(3); // Auto-scale
        }
        
        setStatus(sysStats);
      } catch (err) {
        console.error("Critical Failure:", err);
      }
    }
    initializeSystem();
  }, []);

  return (
    <div className="cluster-monitor">
      {status ? <Dashboard data={status} /> : <BootSequence />}
    </div>
  );
}

class SingletonManager {
  private static instance: SingletonManager;
  
  private constructor() {
    this.connectDatabase();
  }

  public static getInstance(): SingletonManager {
    if (!SingletonManager.instance) {
      SingletonManager.instance = new SingletonManager();
    }
    return SingletonManager.instance;
  }
}
`;

// Upgrades
interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  locPerSec: number;
  locPerClick: number;
}

const UPGRADES: Upgrade[] = [
  { id: 'mech_kb', name: 'Mechanical Keyboard', description: '+1 LOC / Click', baseCost: 50, locPerSec: 0, locPerClick: 1 },
  { id: 'coffee', name: 'Espresso Maker', description: '+5 LOC / Sec', baseCost: 150, locPerSec: 5, locPerClick: 0 },
  { id: 'intern', name: 'Hire Intern', description: '+20 LOC / Sec (Bugs!)', baseCost: 1000, locPerSec: 20, locPerClick: 0 },
  { id: 'copilot', name: 'AI Code Assistant', description: '+100 LOC / Sec', baseCost: 5000, locPerSec: 100, locPerClick: 0 },
  { id: 'senior', name: '10x Developer', description: '+500 LOC / Sec', baseCost: 25000, locPerSec: 500, locPerClick: 0 },
  { id: 'server', name: 'Cloud K8s Cluster', description: '+2500 LOC / Sec', baseCost: 100000, locPerSec: 2500, locPerClick: 0 },
];

const ICONS: Record<string, any> = {
  mech_kb: Keyboard,
  coffee: Coffee,
  intern: User,
  copilot: Bot,
  senior: Brain,
  server: Server
};

export default function Game() {
  const [user, loading] = useAuthState(auth);
  const [isLoaded, setIsLoaded] = useState(false);

  const [loc, setLoc] = useState<number>(0);
  const [totalLoc, setTotalLoc] = useState<number>(0);
  const [syncedLoc, setSyncedLoc] = useState<number>(0);

  const [typedChars, setTypedChars] = useState<number>(0);
  const [ownedUpgrades, setOwnedUpgrades] = useState<{ id: string; count: number }[]>(
    UPGRADES.map(u => ({ id: u.id, count: 0 }))
  );
  
  const [locPerClick, setLocPerClick] = useState<number>(1);
  const [locPerSec, setLocPerSec] = useState<number>(0);

  const [activeBug, setActiveBug] = useState<boolean>(false);
  const [floaties, setFloaties] = useState<{id: number, x: number, y: number, text: string, color?: string}[]>([]);
  const floatyIdRef = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // --- ADDICTION MECHANICS (Flow State & Variable Rewards) ---
  const [combo, setCombo] = useState<number>(1);
  const lastKeyPressTimeRef = useRef<number>(Date.now());
  const [goldenIdea, setGoldenIdea] = useState<{x: number, y: number} | null>(null);
  const [frenzyMode, setFrenzyMode] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Leaderboard data
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('totalLoc', 'desc'), limit(10));
  const [leaderboardData] = useCollectionData(q);

  // Re-Calculate rates when upgrades change
  useEffect(() => {
    let newLpc = 1;
    let newLps = 0;
    
    ownedUpgrades.forEach(u => {
      const upgradeDef = UPGRADES.find(def => def.id === u.id);
      if (upgradeDef) {
        newLpc += upgradeDef.locPerClick * u.count;
        newLps += upgradeDef.locPerSec * u.count;
      }
    });

    setLocPerClick(newLpc);
    setLocPerSec(newLps);
  }, [ownedUpgrades]);

  // Read saved data when logged in
  useEffect(() => {
    if (!user) {
      setLoc(0);
      setTotalLoc(0);
      setSyncedLoc(0);
      setOwnedUpgrades(UPGRADES.map(u => ({ id: u.id, count: 0 })));
      setIsLoaded(false);
      return;
    }

    const loadData = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setLoc(data.totalLoc || 0);
          setTotalLoc(data.totalLoc || 0);
          setSyncedLoc(data.totalLoc || 0);
        }
      } catch (err) {
        console.error("Failed to load user state", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [user]);

  // Sync to database periodically
  useEffect(() => {
    if (!user || !isLoaded) return;
    
    const interval = setInterval(async () => {
      const currentLoc = Math.floor(totalLoc);
      if (currentLoc > syncedLoc) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            userId: user.uid,
            displayName: user.displayName || 'Anonymous Coder',
            totalLoc: currentLoc,
            locPerSec: locPerSec,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          setSyncedLoc(currentLoc);
        } catch (err) {
          try {
             handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
          } catch(e) {}
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [user, totalLoc, syncedLoc, locPerSec, isLoaded]);

  // Passive LOC Generation Loop
  useEffect(() => {
    if (locPerSec === 0 || activeBug) return; 

    const interval = setInterval(() => {
      setLoc(prev => prev + (locPerSec / 10)); 
      setTotalLoc(prev => prev + (locPerSec / 10));
      
      setTypedChars(prev => {
         const charsToAdd = Math.max(1, Math.floor(locPerSec / 10));
         return (prev + charsToAdd) % CODE_SNIPPET.length;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [locPerSec, activeBug]);

  // Bug Spawner
  useEffect(() => {
    if (locPerSec < 10) return; // Only spawn bugs once they have automations

    const bugTimer = setInterval(() => {
      if (!activeBug && Math.random() < 0.10) {
         setActiveBug(true);
      }
    }, 12000);

    return () => clearInterval(bugTimer);
  }, [locPerSec, activeBug]);

  // Combo Timeout & Golden Idea Spawner
  useEffect(() => {
    const ticker = setInterval(() => {
      // Combo decay
      if (Date.now() - lastKeyPressTimeRef.current > 700) {
        setCombo(1);
      }

      // Random Golden Idea drop
      if (!activeBug && !goldenIdea && Math.random() < 0.05) {
         if (editorRef.current) {
            const rect = editorRef.current.getBoundingClientRect();
            setGoldenIdea({
               x: 50 + Math.random() * (rect.width - 100),
               y: 50 + Math.random() * (rect.height - 100)
            });
         }
      }
    }, 500);
    return () => clearInterval(ticker);
  }, [activeBug, goldenIdea]);

  // Global Keydown for Manual Coding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      e.preventDefault(); 
      if (activeBug) return;

      // Update Combo
      const now = Date.now();
      if (now - lastKeyPressTimeRef.current < 400) {
        setCombo(prev => Math.min(prev + 0.1, 5.0)); // Max 5x combo
      } else if (now - lastKeyPressTimeRef.current > 700) {
        setCombo(1);
      }
      lastKeyPressTimeRef.current = now;

      // Calculate Increment
      const frenzyMult = frenzyMode ? 10 : 1;
      const incrementValue = Math.floor(locPerClick * combo * frenzyMult);
      
      setLoc(prev => prev + incrementValue);
      setTotalLoc(prev => prev + incrementValue);
      setTypedChars(prev => (prev + 3) % CODE_SNIPPET.length);

      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        const startX = Math.max(20, rect.width / 2 + (Math.random() * 100 - 50));
        const startY = Math.max(20, rect.height / 2 + (Math.random() * 100 - 50));
        
        const fId = floatyIdRef.current++;
        setFloaties(prev => [...prev, { 
          id: fId, 
          x: startX, 
          y: startY, 
          text: frenzyMode ? `FRENZY +${incrementValue}` : `+${incrementValue}`,
          color: frenzyMode ? '#f43f5e' : (combo > 2 ? '#fbbf24' : '#569cd6')
        }]);

        setTimeout(() => {
          setFloaties(prev => prev.filter(f => f.id !== fId));
        }, 800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [locPerClick, activeBug, combo, frenzyMode]);

  const handleGoldenClick = () => {
     setGoldenIdea(null);
     
     // Random Reward: Frenzy Mode (30%) or Instant LOC Drop (70%)
     if (Math.random() < 0.3) {
        setFrenzyMode(true);
        setTimeout(() => setFrenzyMode(false), 10000); // 10s frenzy
     } else {
        const drop = locPerSec * 60 + locPerClick * 1000;
        setLoc(prev => prev + drop);
        setTotalLoc(prev => prev + drop);
        
        // Huge floaty
        if (editorRef.current) {
          const rect = editorRef.current.getBoundingClientRect();
          const fId = floatyIdRef.current++;
          setFloaties(prev => [...prev, { id: fId, x: rect.width/2, y: rect.height/2, text: `EUREKA! +${Math.floor(drop).toLocaleString()}`, color: '#a855f7' }]);
          setScreenShake(true);
          setTimeout(() => {
             setFloaties(prev => prev.filter(f => f.id !== fId));
             setScreenShake(false);
          }, 1500);
        }
     }
  };

  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const owned = ownedUpgrades.find(u => u.id === upgradeId)?.count || 0;
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, owned));

    if (loc >= cost) {
      setLoc(prev => prev - cost);
      setOwnedUpgrades(prev => prev.map(u => 
        u.id === upgradeId ? { ...u, count: u.count + 1 } : u
      ));
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Syntax highlighting for visible code snippet
  const displayCode = CODE_SNIPPET.substring(0, typedChars);
  const visibleLines = displayCode.split('\n').slice(-25);

  const getSyntaxHighlightedLine = (line: string) => {
    // A simplified, safe regex highlighting that handles basic token types
    // without stepping on its own HTML span classes.
    let inString = false;
    let out = '';
    
    // Quick hack for nice looking colors
    // In a real app we'd use PrismJS, but for this self-contained script we use regex styling carefully.
    const hlLine = line
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escape HTML
      .replace(/\b(export|import|from|function|class|const|let|var|if|else|return|async|await|new|private)\b/g, '<span class="text-[#f92672] font-medium">$1</span>') // Pink (Keywords)
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-[#ae81ff]">$1</span>') // Purple (Booleans)
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="text-[#66d9ef] italic">$1</span>') // Cyan (Classes/Types)
      .replace(/\b(useState|useEffect|useCallback|console|fetch)\b/g, '<span class="text-[#a6e22e]">$1</span>') // Green (Hooks/Built-ins)
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`|'.*?'|".*?")/g, '<span class="text-[#e6db74]">$1</span>') // Yellow (Strings)
      .replace(/(\/\/.*)/g, '<span class="text-[#75715e] italic">$1</span>'); // Gray (Comments)

    return hlLine;
  };

  return (
    <div className="flex w-full h-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans overflow-hidden select-none">
      
      {/* LEFT: Explorer (Leaderboard) */}
      <aside className="w-64 bg-[#252526] border-r border-[#333333] flex flex-col flex-shrink-0 z-20 shadow-xl hidden md:flex">
        <div className="p-3 text-xs font-semibold uppercase tracking-widest text-[#cccccc] mb-2 flex items-center gap-2">
           <Trophy className="w-4 h-4 text-yellow-500" />
           Global Top Devs
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-[1px]">
          {leaderboardData?.map((lUser, idx) => (
             <div 
               key={lUser.userId} 
               className={`px-4 py-2 flex justify-between items-center text-sm transition-colors ${lUser.userId === user?.uid ? 'bg-[#37373d] border-l-2 border-[#007acc]' : 'hover:bg-[#2a2d2e] border-l-2 border-transparent'}`}
             >
               <div className="flex items-center gap-2 truncate pr-2">
                 <span className={`font-mono text-xs ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-[#858585]'}`}>
                   {idx + 1}.
                 </span>
                 <span className="truncate max-w-[120px]" title={lUser.displayName}>
                   {lUser.displayName} 
                 </span>
               </div>
               <span className="text-xs text-[#4ec9b0] font-mono shrink-0">
                 {Math.floor(lUser.totalLoc || 0).toLocaleString()}
               </span>
             </div>
          ))}
          {!leaderboardData?.length && (
            <div className="text-xs text-[#858585] p-3">No data available</div>
          )}
        </div>
        
        {/* Profile / Status Section */}
        <div className="bg-[#333333] p-4 text-sm mt-auto border-t border-[#444444]">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[#cccccc]">
                <span className="truncate break-all">Logged in as {user.displayName?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="text-[#858585] hover:text-white" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button 
                onClick={handleLogin}
                className="w-full bg-[#007acc] hover:bg-[#005f9e] text-white py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition"
              >
                <LogIn className="w-4 h-4" /> Sign in to sync
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MID: Editor */}
      <motion.main 
         className={`flex-1 flex flex-col relative min-w-0 transition-colors duration-500 overflow-hidden ${frenzyMode ? 'bg-[#2a0815] shadow-[inset_0_0_100px_rgba(244,63,94,0.1)]' : 'bg-[#1e1e1e]'}`}
         ref={editorRef}
         animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
         transition={{ duration: 0.4 }}
      >
         {/* Frenzy Mode Overlay */}
         <AnimatePresence>
            {frenzyMode && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#f43f5e] pointer-events-none z-0"
               />
            )}
         </AnimatePresence>

         {/* Editor Tabs */}
         <div className="flex bg-[#252526] text-sm overflow-x-auto custom-scrollbar-thin shrink-0 border-b border-[#333333] z-10">
            <div className="px-4 py-2 bg-[#1e1e1e] text-white border-t-2 border-[#007acc] flex items-center gap-2 cursor-pointer shrink-0">
              <Code2 className="w-4 h-4 text-[#519aba]" /> core.tsx 
              <span className="ml-2 w-2 h-2 rounded-full bg-[#ccc]"></span>
            </div>
            <div className="px-4 py-2 text-[#969696] hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer shrink-0 transition">
              styles.css
            </div>
            <div className="px-4 py-2 text-[#969696] hover:bg-[#2a2d2e] flex items-center gap-2 cursor-pointer shrink-0 transition">
              package.json
            </div>
         </div>

         {/* Editor Content Area */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative">
           
            {/* Visual Header / Stats Overlay */}
            <div className="fixed top-12 left-auto right-auto w-fit opacity-80 pointer-events-none z-10 flex gap-6 mt-4 ml-4">
              <div>
                <div className="text-xs text-[#858585] uppercase tracking-widest font-semibold mb-1">Local Files (LOC)</div>
                <div className="text-4xl font-mono text-white tracking-tight">{Math.floor(loc).toLocaleString()}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-[#858585] uppercase tracking-widest font-semibold mb-1">LOC / Sec</div>
                <div className="text-xl font-mono text-[#b5cea8]">{locPerSec.toFixed(1)}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-[#858585] uppercase tracking-widest font-semibold mb-1">LOC / Click</div>
                <div className="text-xl font-mono text-[#dcdcaa]">{locPerClick}</div>
              </div>
              
              {/* Combo Multiplier UI */}
              <div className="hidden sm:block ml-8">
                <div className="text-xs text-[#858585] uppercase tracking-widest font-semibold mb-1">Flow State</div>
                <div className={`text-2xl font-black font-mono transition-colors ${combo > 1.5 ? (combo >= 4.9 ? 'text-[#f43f5e] animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'text-[#fbbf24] drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]') : 'text-[#858585]'}`}>
                  x{combo.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Click Floaties */}
            {floaties.map(f => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: f.y, x: f.x, scale: 0.8 }}
                animate={{ opacity: 0, y: f.y - 70, scale: 1.2 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ color: f.color || '#569cd6' }}
                className="fixed font-bold font-mono text-lg z-30 pointer-events-none drop-shadow-md"
              >
                {f.text}
              </motion.div>
            ))}

            {/* Golden Idea / Loot Drop */}
            <AnimatePresence>
              {goldenIdea && (
                <motion.div
                   initial={{ opacity: 0, scale: 0 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0 }}
                   className="absolute z-50 cursor-pointer"
                   style={{ left: goldenIdea.x, top: goldenIdea.y }}
                   onClick={handleGoldenClick}
                >
                   <div className="w-12 h-12 bg-[#fbbf24] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,1)] animate-bounce border-2 border-white">
                      <Sparkles className="w-6 h-6 text-white" />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code Rendering */}
            <div className="font-mono text-[13px] sm:text-sm leading-6 flex gap-4 w-full h-full items-end pb-8">
               {/* Line Numbers */}
               <div className="text-[#858585] text-right select-none flex flex-col pt-[120px]">
                 {visibleLines.map((_, i) => <div key={i}>{i+1}</div>)}
               </div>
               
               {/* The Code */}
               <div className="flex-1 w-full pt-[120px]">
                  {visibleLines.map((line, i) => (
                    <div 
                      key={i} 
                      className="whitespace-pre min-h-[1.5em] w-full"
                      dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedLine(line) || ' ' }}
                    />
                  ))}
                  <div className="inline-block w-[8px] h-[1em] bg-[#cccccc] animate-pulse align-middle ml-1"></div>
               </div>
            </div>

            {/* Bug Popup */}
            <AnimatePresence>
              {activeBug && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: -20 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-[#252526] border border-[#f48771] p-6 rounded-lg shadow-2xl max-w-sm w-[90%] text-center"
                >
                  <Bug className="w-12 h-12 text-[#f48771] mx-auto mb-3" />
                  <h3 className="text-[#f48771] font-bold text-lg mb-2">Build Failed!</h3>
                  <p className="text-[#cccccc] text-xs font-mono mb-6 bg-[#1e1e1e] p-2 rounded">ReferenceError: isNotDefined is not defined</p>
                  <button 
                    onClick={() => setActiveBug(false)}
                    className="w-full bg-[#f48771] hover:bg-[#d16e5a] text-[#1e1e1e] font-bold py-2 px-4 rounded text-sm transition-colors shadow-lg"
                  >
                    Squash Bug to Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         {/* Bottom Status Bar */}
         <div className={`h-6 w-full flex items-center justify-between px-3 text-white text-[11px] font-sans select-none shrink-0 transition-colors ${frenzyMode ? 'bg-[#be123c]' : 'bg-[#007acc]'}`}>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[#9f1239]' : 'hover:bg-[#005f9e]'}`}><Sparkles className="w-3 h-3" /> main</span>
              <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[#9f1239]' : 'hover:bg-[#005f9e]'}`}><Terminal className="w-3 h-3" /> TypeScript React</span>
            </div>
            <div className="flex items-center gap-4">
               {user && <span>Syncing {syncedLoc.toLocaleString()} LOC to Cloud...</span>}
               <span>{frenzyMode ? 'FRENZY_MODE_ACTIVE' : 'UTF-8'}</span>
            </div>
         </div>
      </motion.main>

      {/* RIGHT: Extensions (Upgrades) */}
      <aside className="w-72 bg-[#252526] border-l border-[#333333] flex flex-col flex-shrink-0 z-20 shadow-xl hidden lg:flex">
         <div className="p-3 text-xs font-semibold uppercase tracking-widest text-[#cccccc] border-b border-[#333333] flex items-center gap-2">
            EXTENSIONS: MARKETPLACE
         </div>

         <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 custom-scrollbar-thin">
            {UPGRADES.map(upgrade => {
              const ownedCount = ownedUpgrades.find(u => u.id === upgrade.id)?.count || 0;
              const cost = Math.floor(upgrade.baseCost * Math.pow(1.15, ownedCount));
              const canAfford = loc >= cost;
              const Icon = ICONS[upgrade.id];

              return (
                <button
                  key={upgrade.id}
                  onClick={() => buyUpgrade(upgrade.id)}
                  disabled={!canAfford}
                  className={`w-full text-left p-3 rounded border transition-colors flex items-start gap-3 ${
                    canAfford 
                      ? 'bg-[#2a2d2e] hover:bg-[#37373d] border-transparent hover:border-[#4ec9b0]/50 cursor-pointer' 
                      : 'bg-[#252526] border-transparent opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="mt-1">
                    <Icon className={`w-8 h-8 ${canAfford ? 'text-[#4ec9b0]' : 'text-[#858585]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px] text-white truncate">{upgrade.name}</h3>
                    <p className="text-[11px] text-[#cccccc] mb-1">{upgrade.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[11px] font-mono ${canAfford ? 'text-[#ce9178]' : 'text-[#858585]'}`}>
                         Install: {cost.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-[#333333] px-1.5 py-0.5 rounded text-[#cccccc]">
                         Lv {ownedCount}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
         </div>
      </aside>

      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #424242; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
      `}</style>
    </div>
  );
}
