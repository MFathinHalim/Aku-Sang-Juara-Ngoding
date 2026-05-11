import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Trophy, Medal, Star, Cpu, Server, Code, Bug } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UserProfileProps {
  onClose: () => void;
  uid: string; // the logged-in user 
  displayName: string;
  photoURL?: string;
}

export const ACHIEVEMENTS_LIST = [
  { id: "FIRST_CODE", name: "Hello World", desc: "Write your first 100 lines of code.", icon: Code },
  { id: "JUNIOR_DEV", name: "Junior Developer", desc: "Reach 10,000 total lines of code.", icon: Star },
  { id: "SENIOR_DEV", name: "10x Developer", desc: "Reach 1,000,000 total lines of code.", icon: Trophy },
  { id: "TITAN_DEV", name: "Silicon Valley Titan", desc: "Reach 100,000,000 total lines of code.", icon: Cpu },
  { id: "BUG_SQUASHER", name: "Bug Squasher", desc: "Fix your first production bug.", icon: Medal },
  { id: "BUG_HUNTER_LEGEND", name: "Bug Hunter Legend", desc: "Squash 100 production bugs.", icon: Bug },
  { id: "FIRST_AUTO", name: "Automation", desc: "Hire your first Junior Dev / Autobuyer.", icon: Cpu },
  { id: "SERVER_FARM", name: "Server Farm", desc: "Reach 1,000 LOC per second.", icon: Server },
  { id: "DATA_CENTER", name: "Data Center Mogul", desc: "Reach 100,000 LOC per second.", icon: Server },
];

export function UserProfile({ onClose, uid, displayName, photoURL }: UserProfileProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [myProfile, setMyProfile] = useState<any>(null);

  useEffect(() => {
    // Load my profile
    const fetchMyProfile = async () => {
      try {
        const q = query(collection(db, 'users'), where('userId', '==', uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setMyProfile(snapshot.docs[0].data());
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    fetchMyProfile();
  }, [uid]);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setSearchedUser(null);
    try {
      const q = query(
        collection(db, 'users'), 
        where('displayName', '==', searchQuery.trim()),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setSearchedUser(snapshot.docs[0].data());
      } else {
        setSearchedUser("NOT_FOUND");
      }
    } catch (err) {
      console.error(err);
      setSearchedUser("ERROR");
    } finally {
      setLoading(false);
    }
  };

  const currentProfile = searchedUser && typeof searchedUser === 'object' ? searchedUser : myProfile;
  const activePhoto = currentProfile?.photoURL || (currentProfile?.userId === uid ? photoURL : null);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className="bg-[var(--bg-sidebar)] w-full max-w-2xl border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-main)] font-sans"
      >
        <div className="flex justify-between items-center p-4 border-b border-[var(--border)] bg-[var(--bg-main)]">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserIcon /> Developer Registration
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--border-light)] rounded transition cursor-pointer"><X /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input 
                type="text" 
                placeholder="Search developer by exact name..."
                required
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--border)] border border-[var(--border-light)] rounded-lg py-2 pl-10 pr-4 outline-none focus:border-[var(--color-primary)] transition-colors text-white"
              />
            </div>
            <button type="submit" disabled={loading} className="bg-[var(--color-primary)] hover:bg-[#4d93ce] text-[var(--bg-main)] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer">
              {loading ? '...' : 'Search'}
            </button>
            {searchedUser && <button type="button" onClick={() => setSearchedUser(null)} className="px-4 py-2 bg-[var(--border-light)] rounded-lg hover:bg-[#4b5363] transition-colors cursor-pointer">Clear</button>}
          </form>

          {searchedUser === "NOT_FOUND" && (
            <div className="text-center py-10 text-[var(--color-error)]">
              Developer not found in the registry. Names are case-sensitive.
            </div>
          )}

          {currentProfile && currentProfile !== "NOT_FOUND" && currentProfile !== "ERROR" && (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center border border-[var(--color-primary)]/30 shadow-[0_0_15px_rgba(97,175,239,0.3)] overflow-hidden">
                  {activePhoto ? (
                    <img src={activePhoto} alt={currentProfile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-3xl font-bold text-[var(--color-primary)]">{currentProfile.displayName?.charAt(0).toUpperCase()}</div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{currentProfile.displayName}</h3>
                  <p className="text-[var(--color-success)] font-mono">{Math.floor(currentProfile.totalLoc || 0).toLocaleString()} Total LOC</p>
                  <p className="text-[var(--text-muted)] text-sm">Flow Rate: {Math.floor(currentProfile.locPerSec || 0).toLocaleString()} LOC/s</p>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                   <Trophy className="w-5 h-5 text-[var(--color-warning)]"/> Achievements Unlocked
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ACHIEVEMENTS_LIST.map((ach) => {
                    const unlocked = currentProfile.achievements?.includes(ach.id);
                    const AchIcon = ach.icon;
                    return (
                      <div key={ach.id} className={`p-4 rounded-xl border flex items-center gap-4 transition-all duration-300 ${
                        unlocked ? 'bg-[var(--bg-hover)] border-[var(--color-warning)]/30' : 'bg-[var(--border)] border-transparent opacity-50 grayscale'
                      }`}>
                         <div className={`p-3 rounded-full ${unlocked ? 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]' : 'bg-[var(--border-light)] text-[var(--text-muted)]'}`}>
                           <AchIcon className="w-6 h-6" />
                         </div>
                         <div>
                           <div className={`font-semibold ${unlocked ? 'text-white' : 'text-[var(--text-main)]'}`}>{ach.name}</div>
                           <div className="text-xs text-[var(--text-muted)]">{ach.desc}</div>
                         </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )
}
