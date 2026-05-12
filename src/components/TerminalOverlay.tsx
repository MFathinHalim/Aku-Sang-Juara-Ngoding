import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sfx } from '../lib/audio';

interface TerminalOverlayProps {
  onFixBug: () => void;
}

type BugType = {
  message: string;
  solution: string;
};

const BUGS: BugType[] = [
  // --- Runtime & Memory Issues ---
  { message: "FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory", solution: "npm run clean" },
  { message: "Error: listen EADDRINUSE: address already in use :::3000", solution: "killall node" },
  { message: "Uncaught TypeError: Cannot read properties of undefined (reading 'map')", solution: "git reset --hard" },

  // --- Dependency & Build Issues ---
  { message: "Error: Cannot find module 'react-is'\nRequire stack: - /app/node_modules/styled-components/", solution: "npm install" },
  { message: "sh: vite: command not found. Development server failed to start.", solution: "npm install" },
  { message: "Module not found: Error: Can't resolve './components/Hero' in '/src/pages'", solution: "ls -R" },

  // --- Git & Collaboration Issues ---
  { message: "CONFLICT (content): Merge conflict in src/main.tsx\nAutomatic merge failed; fix conflicts.", solution: "git merge --abort" },
  { message: "error: failed to push some refs to 'github.com:repo/devtycoon.git'\nhint: Updates were rejected because the remote contains work that you do not have locally.", solution: "git pull --rebase" },
  { message: "error: Your local changes to the following files would be overwritten by merge:\n\tpackage-lock.json", solution: "git stash" },

  // --- Infrastructure & Cloud Issues (New!) ---
  { message: "Docker Error: No space left on device. Cannot create container.", solution: "docker system prune" },
  { message: "AWS Error: Request has expired. Check your system clock and credentials.", solution: "aws configure" },
  { message: "Kubernetes Error: ImagePullBackOff - Failed to pull image from registry.", solution: "kubectl rollout restart" },

  // --- Database & Security Issues (New!) ---
  { message: "PostgreSQL: FATAL: remaining connection slots are reserved for non-replication superuser connections", solution: "npx db-reset" },
  { message: "Security Alert: Unauthorized access attempt detected in SSH logs from IP 192.168.1.105", solution: "sudo ufw enable" },
  { message: "Redis Error: MISCONF Redis is configured to save RDB snapshots, but it is currently not able to persist on disk.", solution: "redis-cli flushall" },

  // --- Fun/Legacy Issues ---
  { message: "Critical: Production server is on fire. Literally.", solution: "sudo reboot" },
  { message: "Vibe Check Failed: Your code is too messy for the #JuaraVibeCoding challenge.", solution: "npm run lint --fix" },
];
export function TerminalOverlay({ onFixBug }: TerminalOverlayProps) {
  const [bug, setBug] = useState<BugType | null>(null);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Pick a random bug
    const randomBug = BUGS[Math.floor(Math.random() * BUGS.length)];
    setBug(randomBug);
    setHistory([
      "[SYSTEM] CRITICAL EXCEPTION DETECTED.",
      randomBug.message,
      "> Type the correct command to resolve this issue.",
      "> Type 'help' to see available commands."
    ]);
  }, []);

  useEffect(() => {
    // Keep focus
    const focusInput = () => {
      if (inputRef.current) inputRef.current.focus();
    };
    document.addEventListener("click", focusInput);
    focusInput();
    return () => document.removeEventListener("click", focusInput);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !bug) return;

    const cmd = input.trim().toLowerCase(); // Normalize input
    const newHistory = [...history, `$ ${cmd}`];

    setInput("");
    sfx.init();
    sfx.playType();

    // Utility Commands
    if (cmd === 'clear') {
      setHistory(["[SYSTEM] Terminal cleared.", "> Resolve the bug below:", bug.message]);
      return;
    }

    if (cmd === 'ls') {
      newHistory.push("src/  node_modules/  package.json  public/  README.md  .env");
      setHistory(newHistory);
      return;
    }

    if (cmd === 'help') {
      newHistory.push("SYSTEM UTILITIES: clear, ls, help, cheat-sheet");
      newHistory.push("RECOVERY COMMANDS:");
      // Menampilkan 5 command acak agar user tidak terlalu bingung
      const tips = [...new Set(BUGS.map(b => b.solution))].sort(() => 0.5 - Math.random()).slice(0, 5);
      tips.forEach(t => newHistory.push(`- ${t}`));
      setHistory(newHistory);
      return;
    }

    // Logic Resolving Bug
    if (cmd === bug.solution.toLowerCase()) {
      newHistory.push("[OK] Command executed successfully. Bug resolved.");
      setHistory(newHistory);
      setTimeout(() => {
        onFixBug();
      }, 500);
    } else {
      newHistory.push(`[ERROR] '${cmd}' is not the correct solution for this exception.`);
      setHistory(newHistory);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-20"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className="bg-[var(--bg-terminal)] w-full max-w-3xl h-full max-h-[500px] border border-[var(--border-terminal)] rounded shadow-2xl flex flex-col font-mono text-sm overflow-hidden"
      >
        <div className="bg-[var(--border-terminal)] px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="text-[var(--text-terminal-muted)] ml-4 text-xs">root@devtycoon:~</span>
          </div>
          <button
            onClick={() => {
              const newHistory = [...history, "> AVAILABLE COMMANDS:"];
              BUGS.forEach(b => newHistory.push(`- ${b.solution} : ${b.message.substring(0, 30)}...`));
              setHistory(newHistory);
            }}
            className="text-xs text-[var(--text-terminal-muted)] hover:text-white transition-colors bg-[var(--bg-terminal-button)] px-2 py-1 rounded cursor-pointer"
          >
            Cheat Sheet
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-1 text-[var(--text-terminal)]" onClick={() => inputRef.current?.focus()}>
          {history.map((line, i) => (
            <div key={i} className={line.startsWith('[ERROR]') ? 'text-[var(--color-terminal-error)]' : line.startsWith('[CRITICAL]') ? 'text-[var(--color-terminal-error)] font-bold' : line.startsWith('[OK]') ? 'text-[var(--color-terminal-ok)]' : ''}>
              {line}
            </div>
          ))}
          <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
            <span className="text-[var(--color-terminal-ok)]">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none border-none text-[var(--text-terminal)]"
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
