import { useState, useEffect, useRef } from 'react';
import { Terminal, Keyboard, Coffee, User, Bot, Brain, Server, Bug, Sparkles, LogIn, LogOut, Code2, Trophy, Shield, Megaphone, Zap, AlertTriangle, Timer, PanelRightOpen, X, Home, Palette, Box, Layers, Cpu, Globe, Lock, Database as DbIcon, Zap as HighVoltage, Newspaper, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, where, getDocs, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";
import { sfx } from './lib/audio';
import { TerminalOverlay } from './components/TerminalOverlay';
import { UserProfile, ACHIEVEMENTS_LIST } from './components/UserProfile';

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
// ======================
// ADMIN PANEL CONFIG
// ======================
const ADMIN_EMAILS = ['halimfathin7@gmail.com', 'fathincoding@gmail.com'];
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
  { id: 'mech_kb', name: 'Mechanical Keyboard', description: '+1 LOC / Click', baseCost: 100, locPerSec: 0, locPerClick: 1 },
  { id: 'coffee', name: 'Espresso Maker', description: '+5 LOC / Sec', baseCost: 500, locPerSec: 5, locPerClick: 0 },
  { id: 'intern', name: 'Hire Intern', description: '+20 LOC / Sec (Bugs!)', baseCost: 5000, locPerSec: 20, locPerClick: 0 },
  { id: 'copilot', name: 'AI Code Assistant', description: '+150 LOC / Sec', baseCost: 100000, locPerSec: 150, locPerClick: 0 },
  { id: 'senior', name: '10x Developer', description: '+1000 LOC / Sec', baseCost: 1000000, locPerSec: 1000, locPerClick: 0 },
  { id: 'server', name: 'Cloud K8s Cluster', description: '+10000 LOC / Sec', baseCost: 25000000, locPerSec: 10000, locPerClick: 0 },
  { id: 'gpu_farm', name: 'H100 GPU Cluster', description: '+100k LOC / Sec', baseCost: 1000000000, locPerSec: 100000, locPerClick: 0 },
  { id: 'quantum', name: 'Quantum Computer', description: '+1M LOC / Sec', baseCost: 50000000000, locPerSec: 1000000, locPerClick: 0 },
  { id: 'world_sim', name: 'World Simulator', description: '+10M LOC / Sec', baseCost: 1000000000000, locPerSec: 10000000, locPerClick: 0 },
];

const ICONS: Record<string, any> = {
  mech_kb: Keyboard,
  coffee: Coffee,
  intern: User,
  copilot: Bot,
  senior: Brain,
  server: Server,
  gpu_farm: HighVoltage,
  quantum: Cpu,
  world_sim: Globe
};

interface TechFeature {
  id: string;
  name: string;
  description: string;
  icon: any;
  multiplier: number;
}

const TECH_FEATURES: TechFeature[] = [
  { id: 'hello_world', name: 'Hello World', description: 'The humble beginning of every legend.', icon: Code2, multiplier: 0.01 },
  { id: 'dark_mode', name: 'Dark Mode', description: 'Real devs only code in the dark.', icon: Palette, multiplier: 0.02 },
  { id: 'auth_system', name: 'Auth System', description: 'Secure your code from script kiddies.', icon: Lock, multiplier: 0.05 },
  { id: 'database', name: 'Database Schema', description: 'Persistent data for your global users.', icon: DbIcon, multiplier: 0.08 },
  { id: 'api_rest', name: 'REST API', description: 'Connect your services together.', icon: Globe, multiplier: 0.10 },
  { id: 'docker', name: 'Containerization', description: 'It works on my machine!', icon: Box, multiplier: 0.15 },
  { id: 'k8s', name: 'Kubernetes Cluster', description: 'Infinite scale, infinite complexity.', icon: Layers, multiplier: 0.25 },
  { id: 'ai_copilot', name: 'Neural Network', description: 'Self-writing code is the future.', icon: Cpu, multiplier: 0.50 },
  { id: 'realtime', name: 'WebSockets', description: 'Real-time sync for every keystroke.', icon: HighVoltage, multiplier: 0.12 },
  { id: 'unit_tests', name: 'Unit Tests', description: 'Slow down but never break things again.', icon: Shield, multiplier: 0.05 },
];

export default function Game({ onBack }: { onBack?: () => void }) {
  const [user, loading] = useAuthState(auth);
  const [isLoaded, setIsLoaded] = useState(false);

  const isAdmin = user && user.email && ADMIN_EMAILS.includes(user.email);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  const globalEventsRef = collection(db, 'globalEvents');
  const globalActivityRef = collection(db, 'globalActivity');

  const activeEventQuery = query(
    globalEventsRef,
    where('active', '==', true),
    limit(1)
  );

  const activityQuery = query(
    globalActivityRef,
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  const [activeGlobalEvents] = useCollectionData(activeEventQuery);
  const [globalActivities] = useCollectionData(activityQuery);

  const activeEvent = activeGlobalEvents?.[0] as any;

  const ai = useRef(new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

  const logActivity = async (type: 'SHIP' | 'IPO' | 'JOIN', message: string, detail: string = '') => {
    if (!user) return;
    try {
      await addDoc(globalActivityRef, {
        type,
        userId: user.uid,
        displayName: user.displayName || 'Anonymous Coder',
        message,
        detail,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to log activity", err);
    }
  };

  const generateStartupNarrative = async (v: string, features: string[]) => {
    if (!process.env.GEMINI_API_KEY) return;
    setIsGeneratingStory(true);
    try {
      const featNames = features.map(id => TECH_FEATURES.find(f => f.id === id)?.name).join(', ');
      const prompt = `You are a tech journalist at "VibeCrunch". Write a 1-sentence witty, slightly sarcastic, or hyped-up tech blurb for a startup that just shipped version ${v} using these technologies: ${featNames}. Keep it under 140 characters. Use developer slang.`;

      const response = await ai.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      if (response && response.text) {
        setStartupStory(response.text.replace(/["']/g, ''));
      }
    } catch (err) {
      console.error("Gemini Error:", err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const createGlobalEvent = async (
    title: string,
    desc: string,
    multiplier: number,
    type: string
  ) => {
    if (!isAdmin) return;

    try {
      const activeEvents = await getDocs(
        query(globalEventsRef, where('active', '==', true))
      );

      await Promise.all(
        activeEvents.docs.map(d =>
          updateDoc(
            doc(db, 'globalEvents', d.id),
            { active: false }
          )
        )
      );

      await addDoc(globalEventsRef, {
        title,
        description: desc,
        multiplier,
        type,
        active: true,
        createdBy: user?.email,
        createdAt: serverTimestamp()
      });

    } catch (err) {
      console.error(err);
    }
  };

  const endGlobalEvent = async () => {
    if (!isAdmin) return;

    try {
      const activeEvents = await getDocs(
        query(globalEventsRef, where('active', '==', true))
      );

      await Promise.all(
        activeEvents.docs.map(d =>
          updateDoc(
            doc(db, 'globalEvents', d.id),
            { active: false }
          )
        )
      );

    } catch (err) {
      console.error(err);
    }
  };
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
  const [bugsSquashed, setBugsSquashed] = useState<number>(0);

  const [locPerClick, setLocPerClick] = useState<number>(1);
  const [locPerSec, setLocPerSec] = useState<number>(0);

  const [activeBug, setActiveBug] = useState<boolean>(false);
  const [showMarketplace, setShowMarketplace] = useState<boolean>(true);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>([]);
  const [theme, setTheme] = useState<string>('onedark');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'extensions' | 'themes' | 'product'>('extensions');
  const [projectProgress, setProjectProgress] = useState<number>(0);
  const [version, setVersion] = useState<string>('0.1.0');
  const [ipoCount, setIpoCount] = useState<number>(0);
  const [floaties, setFloaties] = useState<{ id: number, x: number, y: number, text: string, color?: string }[]>([]);
  const [startupStory, setStartupStory] = useState<string>('Booting up your startup... Ship something to get noticed.');
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const floatyIdRef = useRef(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // --- ADDICTION MECHANICS (Flow State & Variable Rewards) ---
  const [combo, setCombo] = useState<number>(1);
  const lastKeyPressTimeRef = useRef<number>(Date.now());
  const [goldenIdea, setGoldenIdea] = useState<{ x: number, y: number } | null>(null);
  const [frenzyMode, setFrenzyMode] = useState<boolean>(false);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  const globalMultiplier = (activeEvent ? (activeEvent.multiplier || 1) : 1) * (1 + (ipoCount * 1.5)) * (1 + unlockedFeatures.reduce((acc, featId) => {
    const feat = TECH_FEATURES.find(f => f.id === featId);
    return acc + (feat?.multiplier || 0);
  }, 0));

  // Leaderboard data
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('totalLoc', 'desc'), limit(10));
  const [leaderboardData] = useCollectionData(q);

  const [imgError, setImgError] = useState(false);

  // Re-Calculate rates when upgrades change
  useEffect(() => {
    setImgError(false);
  }, [user?.uid]);

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
          if (data.loc !== undefined) {
            setLoc(data.loc || 0);
          } else {
            setLoc(data.totalLoc || 0);
          }
          setTotalLoc(data.totalLoc || 0);
          setSyncedLoc(data.loc || data.totalLoc || 0);
          if (data.achievements) {
            setAchievements(data.achievements);
          }
          if (data.bugsSquashed) {
            setBugsSquashed(data.bugsSquashed);
          }
          if (data.theme) {
            setTheme(data.theme);
          }
          if (data.unlockedFeatures) {
            setUnlockedFeatures(data.unlockedFeatures);
          }
          if (data.ownedUpgrades) {
            setOwnedUpgrades(data.ownedUpgrades);
          }
          if (data.version) {
            setVersion(data.version);
          }
          if (data.projectProgress) {
            setProjectProgress(data.projectProgress);
          }
          if (data.ipoCount) {
            setIpoCount(data.ipoCount);
          }
        }
      } catch (err) {
        console.error("Failed to load user state", err);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [user]);

  // Persistent State Sync Ref (to avoid interval resets)
  const syncStateRef = useRef<any>(null);
  syncStateRef.current = {
    loc,
    totalLoc,
    locPerSec,
    bugsSquashed,
    achievements,
    unlockedFeatures,
    ownedUpgrades,
    version,
    projectProgress,
    ipoCount,
    theme
  };

  const saveToCloud = async () => {
    if (!user || !isLoaded) return;
    const state = syncStateRef.current;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        displayName: user.displayName || 'Anonymous Coder',
        photoURL: user.photoURL || null,
        loc: Math.floor(state.loc),
        totalLoc: Math.floor(state.totalLoc),
        locPerSec: Math.floor(state.locPerSec),
        bugsSquashed: state.bugsSquashed,
        achievements: state.achievements,
        unlockedFeatures: state.unlockedFeatures,
        ownedUpgrades: state.ownedUpgrades,
        version: state.version,
        projectProgress: state.projectProgress,
        ipoCount: state.ipoCount,
        theme: state.theme,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSyncedLoc(Math.floor(state.loc));
    } catch (err) {
      console.error("Sync Error:", err);
    }
  };

  // Sync to database periodically
  useEffect(() => {
    if (!user || !isLoaded) return;

    const interval = setInterval(() => {
      saveToCloud();
    }, 5000);
    return () => clearInterval(interval);
  }, [user, isLoaded]);

  // Achievement checker
  useEffect(() => {
    if (!isLoaded || !user) return;
    const newAchievements: string[] = [];

    if (totalLoc >= 100 && !achievements.includes('FIRST_CODE')) newAchievements.push('FIRST_CODE');
    if (totalLoc >= 10000 && !achievements.includes('JUNIOR_DEV')) newAchievements.push('JUNIOR_DEV');
    if (totalLoc >= 1000000 && !achievements.includes('SENIOR_DEV')) newAchievements.push('SENIOR_DEV');
    if (totalLoc >= 100000000 && !achievements.includes('TITAN_DEV')) newAchievements.push('TITAN_DEV');
    if (locPerSec >= 1 && !achievements.includes('FIRST_AUTO')) newAchievements.push('FIRST_AUTO');
    if (locPerSec >= 1000 && !achievements.includes('SERVER_FARM')) newAchievements.push('SERVER_FARM');
    if (locPerSec >= 100000 && !achievements.includes('DATA_CENTER')) newAchievements.push('DATA_CENTER');
    if (bugsSquashed >= 100 && !achievements.includes('BUG_HUNTER_LEGEND')) newAchievements.push('BUG_HUNTER_LEGEND');

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements]);
      // Optional: play achievement unlocked sound. Golden idea sound works well!
      sfx.playGoldenIdeaClick();
    }
  }, [totalLoc, locPerSec, achievements, isLoaded, user, bugsSquashed]);

  // Passive LOC Generation Loop
  useEffect(() => {
    if (locPerSec === 0 || activeBug) return;

    const interval = setInterval(() => {
      const generatedLoc = (locPerSec * globalMultiplier) / 10;
      setLoc(prev => prev + generatedLoc);
      setTotalLoc(prev => prev + generatedLoc);
      setProjectProgress(prev => prev + generatedLoc);

      setTypedChars(prev => {
        const charsToAdd = Math.max(1, Math.floor((locPerSec * globalMultiplier) / 10));
        return (prev + charsToAdd) % CODE_SNIPPET.length;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [locPerSec, activeBug, globalMultiplier]);

  // Bug Spawner
  useEffect(() => {
    // Determine bug base chance from locPerSec
    // E.g., locPerSec = 0 -> 1% every 15s. locPerSec = 1000 -> 15% every 15s.
    const spawnChance = Math.min(0.25, 0.01 + (locPerSec / 5000));

    const bugTimer = setInterval(() => {
      if (!activeBug && Math.random() < spawnChance) {
        setActiveBug(true);
        sfx.playError();
        sfx.playSlowMo();
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

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Keydown for Manual Coding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
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
      const incrementValue = Math.floor(locPerClick * combo * frenzyMult * globalMultiplier);

      setLoc(prev => prev + incrementValue);
      setTotalLoc(prev => prev + incrementValue);
      setProjectProgress(prev => prev + incrementValue);
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
      setProjectProgress(prev => prev + drop);

      // Huge floaty
      if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        const fId = floatyIdRef.current++;
        setFloaties(prev => [...prev, { id: fId, x: rect.width / 2, y: rect.height / 2, text: `EUREKA! +${Math.floor(drop).toLocaleString()}`, color: '#a855f7' }]);
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
      setOwnedUpgrades(prev => {
        const next = prev.map(u =>
          u.id === upgradeId ? { ...u, count: u.count + 1 } : u
        );
        return next;
      });
      setTimeout(() => saveToCloud(), 100);
    }
  };

  const shipVersion = () => {
    const nextUnlocks = TECH_FEATURES.filter(f => !unlockedFeatures.includes(f.id));

    // Scaling cost: base 25k * 2^(minor_version)
    const vParts = version.split('.').map(Number);
    const progressNeeded = (vParts[0] * 10 + vParts[1] + 1) * 25000 * Math.pow(1.5, vParts[0]);

    if (projectProgress < progressNeeded) return;

    vParts[1]++; // Minor version
    if (vParts[1] >= 10) {
      vParts[0]++;
      vParts[1] = 0;
    }
    const nextVersion = vParts.join('.');

    // Randomly unlock one feature if available
    if (nextUnlocks.length > 0) {
      const randomFeat = nextUnlocks[Math.floor(Math.random() * nextUnlocks.length)];
      const updatedFeatures = [...unlockedFeatures, randomFeat.id];
      setUnlockedFeatures(updatedFeatures);
      generateStartupNarrative(nextVersion, updatedFeatures);
    } else {
      generateStartupNarrative(nextVersion, unlockedFeatures);
    }

    setVersion(nextVersion);
    setProjectProgress(0);
    setTimeout(() => saveToCloud(), 100);
    logActivity('SHIP', `Shipped version ${nextVersion}!`, `Discovered new tech stack.`);

    sfx.playGoldenIdeaClick();
    sfx.playFrenzyMode();

    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const fId = floatyIdRef.current++;
      setFloaties(prev => [...prev, { id: fId, x: rect.width / 2, y: rect.height / 2, text: `SHIPPED v${nextVersion}!`, color: '#10b981' }]);
      setScreenShake(true);
      setTimeout(() => {
        setFloaties(prev => prev.filter(f => f.id !== fId));
        setScreenShake(false);
      }, 2000);
    }
  };

  const handleIPO = () => {
    const vParts = version.split('.').map(Number);
    const canIPO = vParts[0] >= 1 || totalLoc >= 5000000;

    if (!canIPO) return;

    // Reset everything except tech tree and stats
    setLoc(0);
    setOwnedUpgrades(UPGRADES.map(u => ({ id: u.id, count: 0 })));
    setProjectProgress(0);
    setIpoCount(prev => prev + 1);
    setTimeout(() => saveToCloud(), 100);
    logActivity('IPO', `just went public with an IPO!`, `The legacy grows.`);

    sfx.playGoldenIdeaClick();
    sfx.playFrenzyMode();

    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const fId = floatyIdRef.current++;
      setFloaties(prev => [...prev, { id: fId, x: rect.width / 2, y: rect.height / 2, text: `IPO SUCCESS! LEGACY +150%`, color: '#fbbf24' }]);
      setScreenShake(true);
      setTimeout(() => {
        setFloaties(prev => prev.filter(f => f.id !== fId));
        setScreenShake(false);
      }, 3000);
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
  const visibleLines = displayCode.split('\n').slice(-35);

  const getSyntaxHighlightedLine = (line: string) => {
    // A simplified, safe regex highlighting that handles basic token types
    // without stepping on its own HTML span classes.
    let inString = false;
    let out = '';

    // Quick hack for nice looking colors
    // In a real app we'd use PrismJS, but for this self-contained script we use regex styling carefully.
    const hlLine = line
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escape HTML
      .replace(/\b(export|import|from|function|class|const|let|var|if|else|return|async|await|new|private)\b/g, '<span class="text-[var(--color-keyword)] font-medium">$1</span>') // Purple (Keywords)
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="text-[var(--color-info)]">$1</span>') // Orange (Booleans/Null)
      .replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="text-[var(--color-warning)] italic">$1</span>') // Yellow (Classes/Types)
      .replace(/\b(useState|useEffect|useCallback|console|fetch)\b/g, '<span class="text-[var(--color-primary)]">$1</span>') // Blue (Hooks/Built-ins)
      .replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`|'.*?'|".*?")/g, '<span class="text-[var(--color-success)]">$1</span>') // Green (Strings)
      .replace(/(\/\/.*)/g, '<span class="text-[var(--text-muted)] italic">$1</span>'); // Gray (Comments)

    return hlLine;
  };

  return (
    <div className="bg-[var(--bg-sidebar)] h-screen">
      <div className='px-5 py-2 flex bg-[var(--bg-sidebar)] text-[var(--text-main)] border-b border-[var(--border)] w-full gap-6  items-center justify-between w-full'>
        <div className='flex gap-2 items-center'>
          <img src="/gdgicon.png" className="pointer-events-none block max-h-[40px]" style={{ minWidth: '20px' }} />
          <span className="text-[#dadce0]">|</span>
          <span>#JuaraVibeCoding</span>
        </div>

        {/* Visual Header / Stats Overlay */}
        <div className="flex gap-6 items-center">
          <div className="flex flex-col items-center">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold hidden sm:block">Valuation</div>
            <div className="text-sm font-black font-mono tracking-tighter text-yellow-500">
              ${(totalLoc * (1 + ipoCount * 1.5)).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold hidden sm:block">Local Files (LOC)</div>
            <div className="text-md font-mono tracking-tight">{Math.floor(loc).toLocaleString()}</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">LOC / Sec</div>
            <div className="text-md font-mono text-[var(--color-success)]">{locPerSec.toFixed(1)}</div>
          </div>
          <div className="hidden sm:block">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">LOC / Click</div>
            <div className="text-md font-mono text-[var(--color-warning)]">{locPerClick}</div>
          </div>

          {/* Combo Multiplier UI */}
          <div className="hidden sm:block">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">Flow State</div>
            <div className={`text-md font-black font-mono transition-colors ${combo > 1.5 ? (combo >= 4.9 ? 'text-[var(--color-error)] animate-pulse drop-shadow-[0_0_8px_rgba(224,108,117,0.8)]' : 'text-[var(--color-info)] drop-shadow-[0_0_5px_rgba(209,154,102,0.5)]') : 'text-[var(--text-muted)]'}`}>
              x{combo.toFixed(1)}
            </div>
          </div>
          <div className="hidden sm:block ml-8">
            <div className="text-xl font-mono text-[var(--color-warning)]"><img src="https://media.tenor.com/kKzoMNDUQ3MAAAAj/arisu-aris.gif" alt="Illustration" className="pointer-events-none w-14 h-14 object-contain filter drop-shadow-md" referrerPolicy="no-referrer" /></div>
          </div>
        </div>
      </div>
      <div className="h-7 border-b border-white/5 z-50 flex items-center overflow-hidden">
        <div className="flex gap-2 items-center px-4 shrink-0 text-[9px] font-black italic text-red-500 uppercase tracking-tighter bg-red-500/10 h-full border-r border-red-500/20 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.5)]">
          <Newspaper className="w-3 h-3" /> Tech News
        </div>
        <div className="flex-1 px-4 relative overflow-hidden h-full flex items-center">
          <motion.div
            className="whitespace-nowrap flex gap-16 text-[10px] font-mono items-center"
            animate={{ x: [0, -1500] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            {[...(globalActivities || []), ...(globalActivities || [])].map((activity: any, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="text-[var(--color-primary)] font-black uppercase">{activity.displayName}</span>
                <span className="text-white/80 font-medium">{activity.message}</span>
                <span className="text-[var(--text-muted)] text-[8px] bg-white/5 px-1.5 py-0.5 rounded italic">{activity.detail}</span>
                <span className="text-white/10 select-none">•</span>
              </span>
            ))}
            {!globalActivities?.length && (
              <span className="text-[var(--text-muted)] italic">Waiting for developer activity on the grid...</span>
            )}
          </motion.div>
        </div>
      </div>

      <div className="flex w-full h-[89%] bg-[var(--bg-main)] text-[var(--text-main)] font-sans overflow-hidden select-none relative ">
        {/* Background slow-mo wrapper */}
        <div className={`flex w-full h-full transition-all duration-1000 ${activeBug ? 'grayscale brightness-50 contrast-125 blur-[1px]' : ''}`}>

          {/* LEFT: Explorer (Leaderboard) */}
          <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col flex-shrink-0 z-20 shadow-xl hidden md:flex">
            <div className="p-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-main)] mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Global Top Devs
              </div>
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 cursor-pointer"
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
                  className={`px-4 py-2 flex justify-between items-center text-sm transition-colors cursor-pointer ${lUser.userId === user?.uid ? 'bg-[var(--bg-hover)] border-l-2 border-[var(--color-primary)]' : 'hover:bg-[var(--bg-hover)] border-l-2 border-transparent'}`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`font-mono text-xs ${idx === 0 ? 'text-[var(--color-warning)]' : idx === 1 ? 'text-[var(--text-main)]' : idx === 2 ? 'text-[var(--color-info)]' : 'text-[var(--text-muted)]'}`}>
                      {idx + 1}.
                    </span>
                    <span className="truncate max-w-[120px]" title={lUser.displayName}>
                      {lUser.displayName}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-success)] font-mono shrink-0">
                    {Math.floor(lUser.totalLoc || 0).toLocaleString()}
                  </span>
                </div>
              ))}
              {!leaderboardData?.length && (
                <div className="text-xs text-[var(--text-muted)] p-3">No data available</div>
              )}
            </div>

            {/* Profile / Status Section */}
            <div className="text-[var(--text-main)] bg-[var(--bg-sidebar)] p-4 text-sm mt-auto border-t border-[var(--border)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/10 to-transparent pointer-events-none" />
              {user ? (
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    {user.photoURL && !imgError ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-10 h-10 rounded-full shadow-[0_0_10px_rgba(97,175,239,0.3)] object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-[var(--bg-main)] font-bold">
                        {user.displayName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[var(--text-main)] font-medium truncate drop-shadow-sm">{user.displayName}</span>
                      <span className="text-[var(--color-primary)] text-xs truncate">Lv {ownedUpgrades.reduce((a, b) => a + b.count, 0)} Developer</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--bg-hover)] hover:bg-[var(--color-primary)]/20 hover:text-[var(--color-primary)] text-[var(--text-main)] py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5" /> Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--bg-hover)] hover:bg-[var(--color-error)]/20 hover:text-[var(--color-error)] text-[var(--text-main)] py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={handleLogin}
                    className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 text-[var(--bg-main)] py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(97,175,239,0.4)] transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" /> Sign in to sync
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* MID: Editor */}
          <motion.main
            className={`flex-1 flex flex-col relative min-w-0 transition-colors duration-500 overflow-hidden ${frenzyMode ? 'bg-[#2c1418] shadow-[inset_0_0_100px_rgba(224,108,117,0.1)]' : 'bg-[var(--bg-main)]'}`}
            ref={editorRef}
            animate={screenShake ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {/* CRT Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>


            {/* Frenzy Mode Overlay */}
            <AnimatePresence>
              {frenzyMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[var(--color-error)] pointer-events-none z-0"
                />
              )}
            </AnimatePresence>

            {/* Global Event Banner */}
            <AnimatePresence>
              {activeEvent && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="absolute top-12 left-0 right-0 z-40 px-4 pointer-events-none"
                >
                  <div className={`mx-auto max-w-2xl px-6 py-3 rounded-full border flex items-center justify-between gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-md pointer-events-auto ${activeEvent.type === 'BUFF' ? 'bg-[var(--color-success)]/20 border-[var(--color-success)]/40' : 'bg-[var(--color-error)]/20 border-[var(--color-error)]/40'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${activeEvent.type === 'BUFF' ? 'bg-[var(--color-success)]/30 text-[var(--color-success)]' : 'bg-[var(--color-error)]/30 text-[var(--color-error)]'}`}>
                        {activeEvent.type === 'BUFF' ? <Zap className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {activeEvent.title}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${activeEvent.type === 'BUFF' ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-error)] text-white'}`}>
                            {activeEvent.multiplier}x Multiplier
                          </span>
                        </h4>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">{activeEvent.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] font-mono whitespace-nowrap">
                      <Timer className="w-3 h-3" /> GLOBAL EVENT
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Editor Tabs */}
            <div className="flex bg-[var(--bg-sidebar)] text-sm overflow-x-auto custom-scrollbar-thin shrink-0 border-b border-[var(--border)] z-10 justify-between items-center pr-2">
              <div className="flex">
                {onBack && (
                  <div
                    onClick={onBack}
                    className="md:hidden px-4 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] flex items-center gap-2 cursor-pointer shrink-0 transition"
                  >
                    <Home className="w-4 h-4" />
                  </div>
                )}
                <div className="px-4 py-2 bg-[var(--bg-main)] text-[var(--text-main)] border-t-2 border-[var(--color-primary)] flex items-center gap-2 cursor-pointer shrink-0">
                  <Code2 className="w-4 h-4 text-[var(--color-primary)]" /> core.tsx
                  <span className="ml-2 w-2 h-2 rounded-full bg-[var(--text-main)]"></span>
                </div>
                <div className="px-4 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] flex items-center gap-2 cursor-pointer shrink-0 transition">
                  styles.css
                </div>
                <div className="px-4 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] flex items-center gap-2 cursor-pointer shrink-0 transition">
                  package.json
                </div>
              </div>
              <div className="flex gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex px-3 shrink-0 items-center gap-1.5 bg-[var(--bg-hover)] hover:bg-[var(--color-warning)]/20 hover:text-[var(--color-warning)] text-[var(--text-main)] py-1.5 rounded transition-colors text-xs font-medium cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" /> Events
                  </button>
                )}
                {!showMarketplace && (
                  <button
                    onClick={() => setShowMarketplace(true)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 rounded hover:bg-[var(--bg-hover)] shrink-0"
                    title="Show Marketplace"
                  >
                    <PanelRightOpen className="w-4 h-4" />
                  </button>
                )}
              </div>
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
                const incrementValue = locPerClick * comboMultiplier * globalMultiplier;

                setLoc(prev => prev + incrementValue);
                setTotalLoc(prev => prev + incrementValue);
                setProjectProgress(prev => prev + incrementValue);

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
                    <div className="w-12 h-12 bg-[var(--color-info)] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(209,154,102,1)] animate-bounce border-2 border-white cursor-pointer">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Code Rendering */}
              <div className="font-mono text-[13px] sm:text-sm leading-6 flex gap-4 w-full h-full items-end pb-8">
                {/* Line Numbers */}
                <div className="text-[var(--text-muted)] text-right select-none flex flex-col pb-6">
                  {visibleLines.map((_, i) => <div key={i}>{i + 1}</div>)}
                </div>

                {/* The Code */}
                <div className="flex-1 w-full">
                  {visibleLines.map((line, i) => (
                    <div
                      key={i}
                      className="whitespace-pre min-h-[1.5em] w-full"
                      dangerouslySetInnerHTML={{ __html: getSyntaxHighlightedLine(line) || ' ' }}
                    />
                  ))}
                  <div className="inline-block w-[8px] h-[1em] bg-[var(--text-main)] animate-pulse align-middle ml-1"></div>
                </div>
              </div>

              {/* Bug Terminal moved outside the wrapper */}
            </div>

            {/* Bottom Status Bar */}
            <div className={`h-6 w-full flex items-center justify-between px-3 text-[var(--bg-main)] text-[11px] font-bold font-sans select-none shrink-0 transition-colors ${frenzyMode ? 'bg-[var(--color-error)]' : 'bg-[var(--color-primary)]'}`}>
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[var(--color-error-dark)]' : 'hover:bg-[var(--color-primary-dark)]'}`}><Sparkles className="w-3 h-3" /> main</span>
                <span className={`flex items-center gap-1 cursor-pointer px-1 py-0.5 rounded transition ${frenzyMode ? 'hover:bg-[var(--color-error-dark)]' : 'hover:bg-[var(--color-primary-dark)]'}`}><Terminal className="w-3 h-3" /> TypeScript React</span>
              </div>
              <div className="flex items-center gap-4">
                {user && <span>Syncing {syncedLoc.toLocaleString()} LOC to Cloud...</span>}
                <span>{frenzyMode ? 'FRENZY_MODE_ACTIVE' : 'UTF-8'}</span>
              </div>
            </div>
          </motion.main>

          {/* RIGHT: Extensions (Upgrades) */}
          {showMarketplace && (
            <aside className="absolute inset-y-0 right-0 w-full sm:w-80 lg:w-72 lg:static bg-[var(--bg-sidebar)] border-l border-[var(--border)] flex flex-col flex-shrink-0 z-50 shadow-2xl">
              {/* Sidebar Tabs */}
              <div className="flex border-b border-[var(--border)] bg-[var(--bg-sidebar)] text-[11px] font-semibold uppercase tracking-wider">
                <button
                  onClick={() => setActiveSidebarTab('extensions')}
                  className={`flex-1 py-3 px-1 text-[10px] text-center transition-colors border-b-2 cursor-pointer ${activeSidebarTab === 'extensions' ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  Extensions
                </button>
                <button
                  onClick={() => setActiveSidebarTab('product')}
                  className={`flex-1 py-3 px-1 text-[10px] text-center transition-colors border-b-2 cursor-pointer ${activeSidebarTab === 'product' ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  Product
                </button>
                <button
                  onClick={() => setActiveSidebarTab('themes')}
                  className={`flex-1 py-3 px-1 text-[10px] text-center transition-colors border-b-2 cursor-pointer ${activeSidebarTab === 'themes' ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--bg-hover)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                >
                  Themes
                </button>
                <button
                  onClick={() => setShowMarketplace(false)}
                  className="px-3 text-[var(--text-muted)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
                  title="Close Panel"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 custom-scrollbar-thin">
                {activeSidebarTab === 'extensions' ? (
                  <>
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
                          className={`w-full text-left p-3 rounded border transition-colors flex items-start gap-3 ${canAfford
                            ? 'bg-[var(--bg-hover)] border-[var(--border)] hover:border-[var(--color-primary)]/50 cursor-pointer'
                            : 'bg-[var(--bg-sidebar)] border-transparent opacity-50 cursor-not-allowed'
                            }`}
                        >
                          <div className="mt-1">
                            <Icon className={`w-8 h-8 ${canAfford ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-[13px] text-[var(--text-main)] truncate">{upgrade.name}</h3>
                            <p className="text-[11px] text-[var(--text-muted)] mb-1">{upgrade.description}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`text-[11px] font-mono ${canAfford ? 'text-[var(--color-warning)]' : 'text-[var(--text-muted)]'}`}>
                                Install: {cost.toLocaleString()}
                              </span>
                              <span className="text-[10px] bg-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                                Lv {ownedCount}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : activeSidebarTab === 'product' ? (
                  <div className="space-y-4 p-1">
                    <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Box className="w-12 h-12" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest mb-1">Current Production</div>
                        <h3 className="text-xl font-black text-white italic tracking-tighter">v{version}</h3>
                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-[var(--text-muted)]">
                            <span>Development Progress</span>
                            <span>{(() => {
                              const vParts = version.split('.').map(Number);
                              const progressNeeded = (vParts[0] * 10 + vParts[1] + 1) * 25000 * Math.pow(1.5, vParts[0]);
                              return Math.min(100, Math.floor((projectProgress / progressNeeded) * 100));
                            })()}%</span>
                          </div>
                          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                              className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-info)]"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(() => {
                                  const vParts = version.split('.').map(Number);
                                  const progressNeeded = (vParts[0] * 10 + vParts[1] + 1) * 25000 * Math.pow(1.5, vParts[0]);
                                  return Math.min(100, (projectProgress / progressNeeded) * 100);
                                })()}%`
                              }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={shipVersion}
                          disabled={(() => {
                            const vParts = version.split('.').map(Number);
                            const progressNeeded = (vParts[0] * 10 + vParts[1] + 1) * 25000 * Math.pow(1.5, vParts[0]);
                            return projectProgress < progressNeeded;
                          })()}
                          className={`mt-4 w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 ${(() => {
                            const vParts = version.split('.').map(Number);
                            const progressNeeded = (vParts[0] * 10 + vParts[1] + 1) * 25000 * Math.pow(1.5, vParts[0]);
                            return projectProgress >= progressNeeded;
                          })() ? 'bg-[var(--color-success)] text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-[1.02] cursor-pointer' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                        >
                          <Zap className="w-4 h-4" /> Ship Feature & Discovery
                        </button>
                      </div>
                    </div>

                    {/* Prestige / IPO Section */}
                    <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 rounded-xl border border-yellow-500/30 relative overflow-hidden group">
                      <div className="absolute -bottom-2 -left-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-16 h-16 text-yellow-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">Company Milestone</div>
                        <h3 className="text-lg font-bold text-white">Initial Public Offering</h3>
                        <p className="text-[10px] text-white/60 mb-4 italic">Reset ops to go public and gain massive permanent scaling.</p>

                        <div className="flex justify-between items-end mb-4">
                          <div>
                            <div className="text-[9px] text-[var(--text-muted)] uppercase">Legacy IPOs</div>
                            <div className="text-sm font-mono font-bold text-white">{ipoCount}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-[var(--text-muted)] uppercase">Legacy Bonus</div>
                            <div className="text-sm font-mono font-bold text-yellow-500">+{((ipoCount * 1.5) * 100).toFixed(0)}% Eff.</div>
                          </div>
                        </div>

                        <button
                          onClick={handleIPO}
                          disabled={(() => {
                            const vParts = version.split('.').map(Number);
                            return !(vParts[0] >= 1 || totalLoc >= 5000000);
                          })()}
                          className={`w-full py-2 rounded-lg font-black text-xs transition-all flex items-center justify-center gap-2 border-2 ${(() => {
                            const vParts = version.split('.').map(Number);
                            return vParts[0] >= 1 || totalLoc >= 5000000;
                          })() ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_25px_rgba(234,179,8,0.3)] hover:scale-[1.05] cursor-pointer' : 'bg-black/40 border-white/10 text-white/20 cursor-not-allowed'}`}
                        >
                          <Globe className="w-4 h-4" /> Go Public (IPO)
                        </button>
                        <div className="mt-2 text-[8px] text-center text-white/40 uppercase tracking-tighter">
                          Requires v1.0.0 or 5.0M Total LOC
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider px-1 pt-2 flex justify-between">
                        <span>Tech Stack Discovery</span>
                        <span>{unlockedFeatures.length} / {TECH_FEATURES.length}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {TECH_FEATURES.map(feat => {
                          const isUnlocked = unlockedFeatures.includes(feat.id);
                          const FeatIcon = feat.icon;
                          return (
                            <div
                              key={feat.id}
                              className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 text-center group ${isUnlocked ? 'bg-[var(--bg-hover)] border-[var(--color-primary)]/20' : 'bg-black/20 border-transparent grayscale opacity-40'}`}
                            >
                              <FeatIcon className={`w-6 h-6 ${isUnlocked ? 'text-[var(--color-primary)]' : 'text-white/20'}`} />
                              <div className="min-w-0">
                                <div className={`text-[10px] font-bold truncate ${isUnlocked ? 'text-white' : 'text-white/20'}`}>
                                  {isUnlocked ? feat.name : 'Unknown'}
                                </div>
                                {isUnlocked && (
                                  <div className="text-[9px] text-[var(--color-success)] font-mono">
                                    +{(feat.multiplier * 100).toFixed(0)}% Eff.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider px-1 pt-2">
                      Installed Themes
                    </div>
                    <div className="space-y-2">
                      {[
                        { id: 'onedark', name: 'One Dark Pro', author: 'binaryify' },
                        { id: 'dracula', name: 'Dracula Official', author: 'dracula-theme' },
                        { id: 'monokai', name: 'Monokai Night', author: 'monokai' },
                        { id: 'github-light', name: 'GitHub Light', author: 'github' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`w-full text-left p-3 rounded border transition-all flex items-center gap-3 ${theme === t.id
                            ? 'bg-[var(--bg-hover)] border-[var(--color-primary)] shadow-[0_0_10px_rgba(97,175,239,0.1)]'
                            : 'bg-[var(--bg-sidebar)] border-transparent hover:bg-[var(--bg-hover)]/50 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer'
                            }`}
                        >
                          <Palette className={`w-5 h-5 ${theme === t.id ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`} />
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-xs font-bold truncate ${theme === t.id ? 'text-[var(--text-main)]' : ''}`}>{t.name}</h4>
                            <p className="text-[10px] font-mono opacity-60">@{t.author}</p>
                          </div>
                          {theme === t.id && (
                            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_5px_var(--color-primary)]" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 bg-[var(--bg-hover)]/30 rounded border border-[var(--border)] italic text-[10px] text-[var(--text-muted)] text-center">
                      More themes coming soon to the Marketplace...
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
          {showAdminPanel && isAdmin && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-gradient-to-r from-[var(--color-warning)]/10 to-transparent">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="text-[var(--color-warning)]" /> Admin Event Panel
                  </h2>
                  <button onClick={() => setShowAdminPanel(false)} className="p-1 hover:bg-[var(--bg-hover)] rounded transition cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {activeEvent ? (
                    <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border)] space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[var(--color-warning)] mb-1">Active Event</div>
                          <h3 className="font-bold text-white">{activeEvent.title}</h3>
                        </div>
                        <span className="text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] px-2 py-0.5 rounded-full border border-[var(--color-success)]/30">
                          {activeEvent.multiplier}x
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{activeEvent.description}</p>
                      <button
                        onClick={() => {
                          endGlobalEvent();
                          setShowAdminPanel(false);
                        }}
                        className="w-full bg-[var(--color-error)] hover:bg-[var(--color-error)]/80 text-white font-bold py-2 rounded-lg transition-colors text-sm cursor-pointer"
                      >
                        Stop Event
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-[var(--text-muted)] text-sm italic">
                      No active global events.
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Quick Presets</div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: "Double Time!", desc: "Double LOC for all devs!", mult: 2.0, type: "BUFF", icon: Zap, color: "text-[var(--color-success)]" },
                        { title: "Global Outage", desc: "Server lag! -50% LOC generation.", mult: 0.5, type: "CRASH", icon: AlertTriangle, color: "text-[var(--color-error)]" },
                        { title: "Juara Coding", desc: "Massive 5x LOC Frenzy!", mult: 5.0, type: "BUFF", icon: Trophy, color: "text-[var(--color-warning)]" },
                        { title: "Coffee Crisis", desc: "Energy low! -20% Speed.", mult: 0.8, type: "CRASH", icon: Coffee, color: "text-amber-500" },
                      ].map((p, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            createGlobalEvent(p.title, p.desc, p.mult, p.type);
                            setShowAdminPanel(false);
                          }}
                          className="p-3 bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-left transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <p.icon className={`w-4 h-4 ${p.color}`} />
                            <span className="text-xs font-bold text-white group-hover:text-[var(--color-primary)] transition-colors">{p.title}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-[var(--text-muted)]">
                    Creating an event will instantly notify all players and apply the logic globaly.
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {activeBug && (
            <TerminalOverlay onFixBug={() => {
              sfx.playBugSquash();
              setActiveBug(false);
              setBugsSquashed(prev => prev + 1);
              setLoc(prev => prev + 500); // Increased reward for harder game
              setTotalLoc(prev => prev + 500);
              if (!achievements.includes('BUG_SQUASHER')) {
                setAchievements(prev => [...prev, 'BUG_SQUASHER']);
                sfx.playGoldenIdeaClick();
              }
            }} />
          )}
          {showProfile && user && (
            <UserProfile onClose={() => setShowProfile(false)} uid={user.uid} displayName={user.displayName || 'Anonymous'} photoURL={user.photoURL || undefined} />
          )}
        </AnimatePresence>

        <style>{`
        .custom-scrollbar-thin::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb { background: #424242; }
        .custom-scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }
      `}</style>
      </div>
    </div>
  );
}
