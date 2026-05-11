import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'motion/react';
import { Play } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { sfx } from './lib/audio';

interface LandingPageProps {
  onStart: () => void;
}

const SMASH_TEXTS = [
  "Press Any Keys",
  "#DEPLOY TO PROD",
  "#GIT PUSH --FORCE",
  "#WORKS ON MY MACHINE",
  "#LGTM 🚀",
  "#SHIP IT YOLO",
  "#DROP TABLE users;",
  "#CTRL + C, CTRL + V",
  "#TO-DO: FIX LATER",
  "#SUDO RM -RF /"
];

export default function LandingPage({ onStart }: LandingPageProps) {
  const [smashText, setSmashText] = useState(SMASH_TEXTS[0]);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const fullPlatformText = "DevTycoon is a (fun) scalability platform that allows you to optimize the infrastructure of a global (in this web) ecosystem.";
  const [displayedText, setDisplayedText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [cursorX, cursorY]);

  const introRef = useRef<HTMLHeadingElement>(null);
  const { scrollYProgress } = useScroll({
    target: introRef,
    offset: ["start 85%", "end 50%"]
  });

  const textLengthValue = useTransform(scrollYProgress, [0, 1], [0, fullPlatformText.length]);

  const photoRef = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress: photoScrollYProgress } = useScroll({
    target: photoRef,
    offset: ["start 90%", "center center"]
  });
  const photoScale = useTransform(photoScrollYProgress, [0, 1], [0.6, 1]);
  const photoOpacity = useTransform(photoScrollYProgress, [0, 1], [0.3, 1]);

  useEffect(() => {
    return textLengthValue.on("change", (latest) => {
      const charCount = Math.round(latest);
      setDisplayedText(fullPlatformText.substring(0, charCount));
      setTypingComplete(charCount === fullPlatformText.length);
    });
  }, [textLengthValue, fullPlatformText]);

  useEffect(() => {
    const handleKeyDown = () => {
      sfx.init();
      sfx.playType();
      // Pick a random text that is different from current
      setSmashText(current => {
        let nextText = current;
        while (nextText === current) {
          nextText = SMASH_TEXTS[Math.floor(Math.random() * SMASH_TEXTS.length)];
        }
        return nextText;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1f1f1f] font-sans selection:bg-[#4285F4] selection:text-white pb-20 overflow-x-hidden">
      {/* Custom Follower Cursor */}
      <motion.div
        className="hidden md:block fixed top-0 left-0 w-80 h-80 bg-[#4285F4]/10 rounded-full blur-[80px] pointer-events-none z-50 mix-blend-multiply transition-opacity duration-300"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          translateX: '-50%',
          translateY: '-50%'
        }}
      />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center pt-16 md:pt-64 px-4 w-full text-xs sm:text-sm font-medium tracking-tight"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Mock Google Logo Colors */}
          <div className="flex items-center gap-0.5 mr-1">
            <img src="/GDG.svg" className="w-full h-full block" style={{ minWidth: '20px' }} />
          </div>
          <span className="text-[#dadce0] mx-2">|</span>
          <span className="text-[#202124]">#JuaraVibeCoding</span>
        </div>
      </motion.header>

      {/* Main Hero */}
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-3xl mx-auto px-6 mt-8 md:mt-12"
      >
        <div className="text-center mb-8 md:mb-32">
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-8"
          >
            Scale your <span className="inline-flex items-center justify-center bg-[#4285F4] text-white rounded-full px-5 pb-3 mx-1 align-middle h-[1.2em] transform -translate-y-1">{"{ }"}</span> to the edge of production
          </motion.h1>

          <motion.div variants={itemVariants} className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sfx.init();
                sfx.playStartGame();
                onStart();
              }}
              onMouseEnter={() => {
                sfx.init();
                sfx.playHover();
              }}
              className="bg-[#1f1f1f] hover:bg-black text-white px-6 py-3 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg cursor-pointer group"
            >
              <div className="bg-white text-black p-0.5 rounded-full group-hover:scale-110 transition-transform">
                <Play className="w-3 h-3 ml-0.5 fill-current" />
              </div>
              Coding Now
            </button>
            <a
              href="#creator"
              className="inline-block bg-[#e8eaed] hover:bg-[#dadce0] text-[#1f1f1f] px-6 py-3 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              The Creator
            </a>
          </motion.div>
        </div>

        {/* Just Smash It Banner */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
        >
          <motion.div
            key={smashText}
            initial={{ scale: 0.95, opacity: 0.5, rotate: -2 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="bg-[#e8eaed] text-[#3c4043] rounded-2xl py-8 mb-16 flex items-center justify-center shadow-inner tracking-widest font-bold text-lg md:text-xl cursor-default overflow-hidden relative"
          >
            <span className="relative z-10">{smashText}</span>
            <div className="absolute inset-0 bg-black/5 opacity-0 hover:opacity-100 transition-opacity"></div>
          </motion.div>
        </motion.div>

        {/* Intro */}
        <motion.h2
          ref={introRef}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
          className="text-2xl md:text-3xl font-medium tracking-tight md:py-64 leading-snug mb-20 max-w-2xl px-2 min-h-[6rem] md:min-h-[4.5rem]"
        >
          {displayedText}
          {!typingComplete && (
            <motion.span
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear", repeatType: "reverse" }}
              className="inline-block w-[3px] h-[0.9em] bg-[#4285F4] ml-1 align-middle"
            />
          )}
        </motion.h2>

        {/* Features List */}
        <div className="space-y-6 mb-20">
          {/* Feature 1 */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            className="flex flex-col md:flex-row items-center gap-6 justify-between group"
          >
            <h3 className="text-2xl font-medium tracking-tight md:w-1/2 px-2 transition-colors group-hover:text-[#4285F4]">High-Frequency <br className="hidden md:block" />Input</h3>
            <div className="bg-[#e8eaed] text-right rounded-2xl p-6 md:w-1/2 text-sm leading-relaxed text-[#3c4043] shadow-inner font-medium transition-colors group-hover:bg-[#dadce0]/50">
              Low-latency keystroke processing for instant coin conversion.
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            className="flex flex-col md:flex-row-reverse items-center gap-6 justify-between group"
          >
            <h3 className="text-2xl font-medium tracking-tight md:w-1/2 px-2 text-left md:text-right transition-colors group-hover:text-[#4285F4]">Scalable <br className="hidden md:block" />Infrastructure</h3>
            <div className="bg-[#e8eaed] text-left rounded-2xl p-6 md:w-1/2 text-sm leading-relaxed text-[#3c4043] shadow-inner font-medium transition-colors group-hover:bg-[#dadce0]/50">
              Modular upgrade architecture from Legacy Systems to Quantum Tools.
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            variants={itemVariants}
            className="flex flex-col md:flex-row items-center gap-6 justify-between group"
          >
            <h3 className="text-2xl font-medium tracking-tight md:w-1/2 px-2 transition-colors group-hover:text-[#4285F4]">Global Sync</h3>
            <div className="bg-[#e8eaed] text-right rounded-2xl p-6 md:w-1/2 text-sm leading-relaxed text-[#3c4043] shadow-inner font-medium transition-colors group-hover:bg-[#dadce0]/50">
              Real-time leaderboard synchronization to validate your dominance.
            </div>
          </motion.div>
        </div>

        {/* Photo Box Placeholder */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
        >
          <motion.a
            ref={photoRef}
            style={{ scale: photoScale, opacity: photoOpacity }}
            id="creator"
            href="https://mfathinhalim.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full aspect-[3/2] bg-[#e8eaed] rounded-[2rem] mb-8 overflow-hidden shadow-inner relative group cursor-pointer scroll-mt-24"
          >
            <img src="https://mfathinhalim.github.io/Fathins/Fathin%20(1).png" alt="M.Fathin Halim" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
          </motion.a>
        </motion.div>

        {/* Bio Section */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
          className="mb-20 px-2"
        >
          <h3 className="text-2xl font-semibold tracking-tight mb-4 text-[#202124]">
            <a href="https://mfathinhalim.github.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#4285F4] transition-colors cursor-pointer inline-flex items-center gap-2">
              M.Fathin Halim
            </a>
          </h3>
          <p className="text-[#3c4043] leading-relaxed mb-4 font-medium text-[15px]">
            M. Fathin Halim is an indie solo developer with five years of experience who thrives on creative storytelling and participating in the <span className="font-bold text-[#202124]">#JuaraVibeCoding</span> challenge by engineering DevTycoon.
          </p>
          <p className="text-[#3c4043] leading-relaxed font-medium text-[15px]">
            Also he is <a href="https://mahiru-shiina.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] font-semibold hover:underline cursor-pointer">Mahiru Shiina's Husband</a> and <a href="https://ishimi-yokoyama.vercel.app" target="_blank" rel="noopener noreferrer" className="text-[#4285F4] font-semibold hover:underline cursor-pointer">Ishimi Yokoyama's Husband</a>
          </p>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
          className="flex flex-col items-center justify-center mb-16"
        >
          {/* Small illustration placeholder */}
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 mb-6"
          >
            <img src="https://cdn2.cdnstep.com/5dLoh8BM9UMZAC8rc0tY/4.thumb128.webp" alt="Illustration" className="w-full h-full object-contain filter drop-shadow-md" referrerPolicy="no-referrer" />
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6">
            What Are You Waiting For?
          </h2>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                sfx.init();
                sfx.playStartGame();
                onStart();
              }}
              onMouseEnter={() => {
                sfx.init();
                sfx.playHover();
              }}
              className="bg-[#1f1f1f] hover:bg-black text-white px-6 py-3 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg cursor-pointer group"
            >
              <div className="bg-white text-black p-0.5 rounded-full group-hover:scale-110 transition-transform flex items-center justify-center">
                <Play className="w-3 h-3 ml-0.5 fill-current" />
              </div>
              Coding Now
            </button>
            <a
              href="#creator"
              className="inline-block bg-[#e8eaed] hover:bg-[#dadce0] text-[#1f1f1f] px-6 py-3 rounded-full font-medium text-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              The Creator
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={itemVariants}
          className="border-t border-[#dadce0] pt-8 pb-4 px-2"
        >
          <h4 className="font-semibold text-lg mb-2 text-[#202124]">DevTycoon</h4>
          <p className="text-[#5f6368] text-sm leading-relaxed max-w-sm">
            DevTycoon is a (fun) scalability platform that allows you to optimize the infrastructure of a global (in this web) ecosystem.
          </p>
        </motion.footer>

      </motion.main>
    </div>
  );
}
