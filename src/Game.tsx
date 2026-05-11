import { useState, useEffect, useRef } from 'react';
import { Terminal, Keyboard, Coffee, User, Bot, Brain, Server, Bug, Sparkles, LogIn, LogOut, Code2, Trophy, PanelRightClose, PanelRightOpen, X, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { sfx } from './lib/audio';

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

export default function Game({ onBack }: { onBack?: () => void }) {
  const [user, loading] = useAuthState(auth);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // start Audio 
    sfx.init();
  }, []);

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
  const [showMarketplace, setShowMarketplace] = useState<boolean>(true);
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
         sfx.playError();
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
            sfx.playGoldenIdeaSpawn();
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
      sfx.init();
      sfx.playType();

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
     sfx.playGoldenIdeaClick();
     
     // Random Reward: Frenzy Mode (30%) or Instant LOC Drop (70%)
     if (Math.random() < 0.3) {
        setFrenzyMode(true);
        sfx.playFrenzyMode();
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
      sfx.playUpgrade();
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
      .replace(/\b(export|import|from|function|class|const|let|var|if|else|return|async|await|new|private)\b/g, '<span class="text-[#c678dd] font-medium">$1</span>') // Purple (Keywords)
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-[#d19a66]">$1</span>') // Orange (Booleans/Null)
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="text-[#e5c07b] italic">$1</span>') // Yellow (Classes/Types)
      .replace(/\b(useState|useEffect|useCallback|console|fetch)\b/g, '<span class="text-[#61afef]">$1</span>') // Blue (Hooks/Built-ins)
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`|'.*?'|".*?")/g, '<span class="text-[#98c379]">$1</span>') // Green (Strings)
      .replace(/(\/\/.*)/g, '<span class="text-[#5c6370] italic">$1</span>'); // Gray (Comments)

    return hlLine;
  };

  return (
    <div className="flex w-full h-screen bg-[#282c34] text-[#abb2bf] font-sans overflow-hidden select-none">
      
      {/* LEFT: Explorer (Leaderboard) */}
      <aside className="w-64 bg-[#21252b] border-r border-[#181a1f] flex flex-col flex-shrink-0 z-20 shadow-xl hidden md:flex">
        <div className="p-3 text-xs font-semibold uppercase tracking-widest text-[#abb2bf] mb-2 flex items-center justify-between gap-2">
           <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Global Top Devs
           </div>
           {onBack && (
              <button 
                onClick={onBack} 
                className="text-[#5c6370] hover:text-[#abb2bf] transition-colors p-1" 
                title="Back to menu"
                aria-label="Back to menu"
              >
                 <Home className="w-4 h-4" />
              </button>
           )}
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-[1px]">
          {leaderboardData?.map((lUser, idx) => (
             <div 
               key={lUser.userId} 
               className={`px-4 py-2 flex justify-between items-center text-sm transition-colors ${lUser.userId === user?.uid ? 'bg-[#2c313a] border-l-2 border-[#61afef]' : 'hover:bg-[#2c313a] border-l-2 border-transparent'}`}
             >
               <div className="flex items-center gap-2 truncate pr-2">
                 <span className={`font-mono text-xs ${idx === 0 ? 'text-[#e5c07b]' : idx === 1 ? 'text-[#abb2bf]' : idx === 2 ? 'text-[#d19a66]' : 'text-[#5c6370]'}`}>
                   {idx + 1}.
                 </span>
                 <span className="truncate max-w-[120px]" title={lUser.displayName}>
                   {lUser.displayName} 
                 </span>
               </div>
               <span className="text-xs text-[#98c379] font-mono shrink-0">
                 {Math.floor(lUser.totalLoc || 0).toLocaleString()}
               </span>
             </div>
          ))}
          {!leaderboardData?.length && (
            <div className="text-xs text-[#5c6370] p-3">No data available</div>
          )}
        </div>
        
        {/* Profile / Status Section */}
        <div className="bg-[#21252b] p-4 text-sm mt-auto border-t border-[#181a1f] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#61afef]/10 to-transparent pointer-events-none" />
          {user ? (
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                   <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full shadow-[0_0_10px_rgba(97,175,239,0.3)] object-cover" />
                ) : (
                   <div className="w-10 h-10 rounded-full bg-[#61afef] flex items-center justify-center text-[#282c34] font-bold">
                     {user.displayName?.[0]?.toUpperCase() || 'U'}
                   </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-[#abb2bf] font-medium truncate drop-shadow-sm">{user.displayName}</span>
                  <span className="text-[#61afef] text-xs truncate">Lv {ownedUpgrades.reduce((a,b) => a+b.count, 0)} Developer</span>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center justify-center gap-2 w-full bg-[#2c313a] hover:bg-[#e06c75]/20 hover:text-[#e06c75] text-[#abb2bf] py-1.5 rounded transition-colors text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button 
                onClick={handleLogin}
                className="w-full bg-[#61afef] hover:bg-[#61afef]/80 text-[#282c34] py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(97,175,239,0.4)] transition"
              >
                <LogIn className="w-4 h-4" /> Sign in to sync
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MID: Editor */}
      <motion.main 
         className={`flex-1 flex flex-col relative min-w-0 transition-colors duration-500 overflow-hidden ${frenzyMode ? 'bg-[#2c1418] shadow-[inset_0_0_100px_rgba(224,108,117,0.1)]' : 'bg-[#282c34]'}`}
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
                  className="absolute inset-0 bg-[#e06c75] pointer-events-none z-0"
               />
            )}
         </AnimatePresence>

         {/* Editor Tabs */}
         <div className="flex bg-[#21252b] text-sm overflow-x-auto custom-scrollbar-thin shrink-0 border-b border-[#181a1f] z-10 justify-between items-center pr-2">
            <div className="flex">
               {onBack && (
                 <div 
                   onClick={onBack}
                   className="md:hidden px-4 py-2 text-[#5c6370] hover:bg-[#2c313a] hover:text-[#abb2bf] flex items-center gap-2 cursor-pointer shrink-0 transition"
                 >
                   <Home className="w-4 h-4" />
                 </div>
               )}
               <div className="px-4 py-2 bg-[#282c34] text-[#abb2bf] border-t-2 border-[#61afef] flex items-center gap-2 cursor-pointer shrink-0">
                 <Code2 className="w-4 h-4 text-[#61afef]" /> core.tsx 
                 <span className="ml-2 w-2 h-2 rounded-full bg-[#abb2bf]"></span>
               </div>
               <div className="px-4 py-2 text-[#5c6370] hover:bg-[#2c313a] hover:text-[#abb2bf] flex items-center gap-2 cursor-pointer shrink-0 transition">
                 styles.css
               </div>
               <div className="px-4 py-2 text-[#5c6370] hover:bg-[#2c313a] hover:text-[#abb2bf] flex items-center gap-2 cursor-pointer shrink-0 transition">
                 package.json
               </div>
            </div>
            {!showMarketplace && (
               <button 
                 onClick={() => setShowMarketplace(true)}
                 className="text-[#5c6370] hover:text-[#abb2bf] transition-colors p-1 rounded hover:bg-[#2c313a] shrink-0"
                 title="Show Marketplace"
               >
                 <PanelRightOpen className="w-4 h-4" />
               </button>
            )}
         </div>

         {/* Editor Content Area */}
         <div 
           className="flex-1 overflow-y-auto overflow-x-hidden p-4 relative cursor-text"
           onClick={() => {
             if (activeBug) return;
             sfx.init();
             sfx.playType();

             const now = Date.now();
             if (now - lastKeyPressTimeRef.current < 400) {
                setCombo(c => Math.min(c + 1, 10)); // Max combo x10
             } else {
                setCombo(1);
             }
             lastKeyPressTimeRef.current = now;

             const comboMultiplier = frenzyMode ? 5 : (1 + (combo * 0.1));
             const incrementValue = locPerClick * comboMultiplier;

             setLoc(prev => prev + incrementValue);
             setTotalLoc(prev => prev + incrementValue);

             setTypedChars(prev => {
                const nextPos = prev + 5;
                return nextPos > CODE_SNIPPET.length ? 0 : nextPos;
             });

             const fId = floatyIdRef.current++;
             setFloaties(prev => [...prev, {
               id: fId,
               x: 200 + Math.random() * 200, 
               y: window.innerHeight - 200 - Math.random() * 100,
               text: frenzyMode ? `FRENZY +${incrementValue.toFixed(1)}` : `+${incrementValue.toFixed(1)}`,
               color: frenzyMode ? '#f43f5e' : (combo > 2 ? '#fbbf24' : '#569cd6')
             }]);

             setTimeout(() => {
               setFloaties(prev => prev.filter(f => f.id !== fId));
             }, 800);
           }}
         >
           
            {/* Visual Header / Stats Overlay */}
            <div className="fixed top-12 left-auto right-auto w-fit opacity-80 pointer-events-none z-10 flex gap-6 mt-4 ml-4">
              <div>
                <div className="text-xs text-[#5c6370] uppercase tracking-widest font-semibold mb-1">Local Files (LOC)</div>
                <div className="text-4xl font-mono text-white tracking-tight">{Math.floor(loc).toLocaleString()}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-[#5c6370] uppercase tracking-widest font-semibold mb-1">LOC / Sec</div>
                <div className="text-xl font-mono text-[#98c379]">{locPerSec.toFixed(1)}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-[#5c6370] uppercase tracking-widest font-semibold mb-1">LOC / Click</div>
                <div className="text-xl font-mono text-[#e5c07b]">{locPerClick}</div>
              </div>
              
              {/* Combo Multiplier UI */}
              <div className="hidden sm:block ml-8">
                <div className="text-xs text-[#5c6370] uppercase tracking-widest font-semibold mb-1">Flow State</div>
                <div className={`text-2xl font-black font-mono transition-colors ${combo > 1.5 ? (combo >= 4.9 ? 'text-[#e06c75] animate-pulse drop-shadow-[0_0_8px_rgba(224,108,117,0.8)]' : 'text-[#d19a66] drop-shadow-[0_0_5px_rgba(209,154,102,0.5)]') : 'text-[#5c6370]'}`}>
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
                   <div className="w-12 h-12 bg-[#d19a66] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(209,154,102,1)] animate-bounce border-2 border-white">
                      <Sparkles className="w-6 h-6 text-white" />
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code Rendering */}
            <div className="font-mono text-[13px] sm:text-sm leading-6 flex gap-4 w-full h-full items-end pb-8">
               {/* Line Numbers */}
               <div className="text-[#5c6370] text-right select-none flex flex-col pt-[120px]">
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
                  <div className="inline-block w-[8px] h-[1em] bg-[#abb2bf] animate-pulse align-middle ml-1"></div>
               </div>
            </div>

            {/* Bug Popup */}
            <AnimatePresence>
              {activeBug && (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: -20 }}
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 bg-[#21252b] border border-[#e06c75] p-6 rounded-lg shadow-2xl max-w-sm w-[90%] text-center"
                >
                  <Bug className="w-12 h-12 text-[#e06c75] mx-auto mb-3 animate-bounce" />
                  <h3 className="text-[#e06c75] font-bold text-lg mb-2">Build Failed!</h3>
                  <p className="text-[#abb2bf] text-xs font-mono mb-6 bg-[#282c34] p-2 rounded">ReferenceError: isNotDefined is not defined</p>
                  <button 
                    onClick={() => {
                        sfx.playBugSquash();
                        setActiveBug(false);
                    }}
                    className="w-full bg-[#e06c75] hover:bg-[#c85a62] text-[#282c34] font-bold py-2 px-4 rounded text-sm transition-colors shadow-[0_0_15px_rgba(224,108,117,0.4)]"
                  >
                    Squash Bug to Continue
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         {/* Bottom Status Bar */}
         <div className={`h-6 w-full flex items-center justify-between px-3 text-[#282c34] text-[11px] font-bold font-sans select-none shrink-0 transition-colors ${frenzyMode ? 'bg-[#e06c75]' : 'bg-[#61afef]'}`}>
            <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[#c85a62]' : 'hover:bg-[#528bff]'}`}><Sparkles className="w-3 h-3" /> main</span>
              <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[#c85a62]' : 'hover:bg-[#528bff]'}`}><Terminal className="w-3 h-3" /> TypeScript React</span>
            </div>
            <div className="flex items-center gap-4">
               {user && <span>Syncing {syncedLoc.toLocaleString()} LOC to Cloud...</span>}
               <span>{frenzyMode ? 'FRENZY_MODE_ACTIVE' : 'UTF-8'}</span>
            </div>
         </div>
      </motion.main>

      {/* RIGHT: Extensions (Upgrades) */}
      {showMarketplace && (
        <aside className="absolute inset-y-0 right-0 w-full sm:w-80 lg:w-72 lg:static bg-[#21252b] border-l border-[#181a1f] flex flex-col flex-shrink-0 z-50 shadow-2xl">
         <div className="p-3 text-xs font-semibold uppercase tracking-widest text-[#abb2bf] border-b border-[#181a1f] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               EXTENSIONS: MARKETPLACE
            </div>
            <button 
              onClick={() => setShowMarketplace(false)} 
              className="text-[#5c6370] hover:text-[#e06c75] transition-colors"
              title="Close Marketplace"
            >
               <X className="w-4 h-4" />
            </button>
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
                      ? 'bg-[#2c313a] hover:bg-[#3e4451] border-[#181a1f] hover:border-[#61afef]/50 cursor-pointer' 
                      : 'bg-[#21252b] border-transparent opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="mt-1">
                    <Icon className={`w-8 h-8 ${canAfford ? 'text-[#98c379]' : 'text-[#5c6370]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[13px] text-[#abb2bf] truncate">{upgrade.name}</h3>
                    <p className="text-[11px] text-[#5c6370] mb-1">{upgrade.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-[11px] font-mono ${canAfford ? 'text-[#e5c07b]' : 'text-[#5c6370]'}`}>
                         Install: {cost.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-[#181a1f] px-1.5 py-0.5 rounded text-[#5c6370]">
                         Lv {ownedCount}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
         </div>
      </aside>
      )}

      <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #424242; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
      `}</style>
    </div>
  );
}
