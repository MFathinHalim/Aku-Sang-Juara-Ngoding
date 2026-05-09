import { motion } from 'motion/react';
import { Terminal } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0e1117] text-white p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-2xl text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#161b22] border border-[#30363d] rounded-2xl flex items-center justify-center shadow-2xl">
            <Terminal className="w-12 h-12 text-[#4ec9b0]" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
          Global <span className="text-[#007acc]">Tech Race</span>
        </h1>
        
        <p className="text-[#8b949e] text-lg md:text-xl max-w-xl mx-auto">
          Represent your country. Write code. Build the ultimate agency. 
          Will your nation dominate the global engineering leaderboard?
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="bg-[#007acc] hover:bg-[#005f9e] text-white font-bold py-4 px-12 rounded-full text-xl shadow-[0_0_40px_rgba(0,122,204,0.4)] transition-all uppercase tracking-widest mt-8"
        >
          Initialize Workspace
        </motion.button>
      </motion.div>
    </div>
  );
}
