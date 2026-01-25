import { useEffect, useRef, useState } from 'react';
import { Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { LandingChatInput } from '@/components/landing/LandingChatInput';
import { useDebugContextOptional } from '@/contexts/DebugContext';

interface HeroProps {
  onGetStarted: (prefillMessage?: string) => void;
}
const CARDS_EN = ["Always watching over you.", "I understand context.", "Ready when you are.", "Let me handle that.", "Optimizing your workflow.", "Done. What's next?"];
const CARDS_AR = ["معك في كل خطوة.", "أفهم ما تحتاجه.", "جاهز لخدمتك.", "اترك الأمر لي.", "أُنجز المهام بذكاء.", "تمّ. ماذا بعد؟"];

export const Hero = ({ onGetStarted }: HeroProps) => {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const debug = useDebugContextOptional();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleCardIndex, setVisibleCardIndex] = useState<number | null>(null);
  const [absorptionPulse, setAbsorptionPulse] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const previousCardRef = useRef<number | null>(null);
  
  // Debug render logging
  useEffect(() => {
    if (debug?.isDebugMode) {
      debug.incrementRenderCount('Hero');
    }
  });

  // Responsive card positions - mobile uses top/bottom layout to avoid horizontal clipping
  const getCardPositions = () => {
    if (isMobile) {
      // Tighter positions to prevent clipping on small screens
      return {
        topLeft: { x: -30, y: -90 },
        middleLeft: { x: 0, y: -100 },
        bottomLeft: { x: 30, y: -90 },
        topRight: { x: -30, y: 90 },
        middleRight: { x: 0, y: 100 },
        bottomRight: { x: 30, y: 90 }
      };
    }
    return {
      topLeft: { x: -180, y: -110 },
      middleLeft: { x: -210, y: 0 },
      bottomLeft: { x: -180, y: 110 },
      topRight: { x: 180, y: -110 },
      middleRight: { x: 210, y: 0 },
      bottomRight: { x: 180, y: 110 }
    };
  };
  const cardPositions = getCardPositions();

  // track pointer relative to container center for subtle eye follow with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth, natural eye movement
  const eyeX = useSpring(mouseX, {
    stiffness: 150,
    damping: 20,
    mass: 0.5
  });
  const eyeY = useSpring(mouseY, {
    stiffness: 150,
    damping: 20,
    mass: 0.5
  });

  // Parallax transforms for floating particles (reduced to 3 for performance)
  const parallax1X = useTransform(mouseX, v => v * 0.02);
  const parallax1Y = useTransform(mouseY, v => v * 0.02);
  const parallax2X = useTransform(mouseX, v => v * 0.03);
  const parallax2Y = useTransform(mouseY, v => v * 0.03);
  const parallax3X = useTransform(mouseX, v => v * 0.015);
  const parallax3Y = useTransform(mouseY, v => v * 0.015);
  // Throttled mouse tracking for performance
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps
    
    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;
      
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set((e.clientX - cx) * 0.12);
      mouseY.set((e.clientY - cy) * 0.12);
    }
    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [mouseX, mouseY]);


  // Unified animation cycle - 3 second rhythm
  // 0.0s: Eye blinks (preparing to speak)
  // 0.15s: Card bursts out (eye speaks)
  // 2.4s: Card returns + absorption pulse
  // 3.0s: Cycle repeats
  useEffect(() => {
    const runAnimationCycle = () => {
      // Phase 1: Blink (0ms) - eye prepares to speak
      setIsBlinking(true);

      // Phase 2: Emit card (150ms after blink completes)
      setTimeout(() => {
        setIsBlinking(false);
        // Get a random card that's different from the previous one
        let availableIndices = [0, 1, 2, 3, 4, 5];
        if (previousCardRef.current !== null) {
          availableIndices = availableIndices.filter(i => i !== previousCardRef.current);
        }
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        previousCardRef.current = randomIndex;
        setVisibleCardIndex(randomIndex);
      }, 150);

      // Phase 3: Start absorption (2400ms - card returns)
      setTimeout(() => {
        setAbsorptionPulse(true);
        setVisibleCardIndex(null);
      }, 2400);

      // Phase 4: Reset absorption pulse (2700ms)
      setTimeout(() => {
        setAbsorptionPulse(false);
      }, 2700);
    };

    // Initial delay of 1.5s before first card burst (after eye appears)
    const initialDelay = setTimeout(() => {
      runAnimationCycle();
    }, 1500);

    // Repeat every 8 seconds (slower for performance)
    const interval = setInterval(runAnimationCycle, 9500); // 1500 + 8000
    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const CARDS = language === 'ar' ? CARDS_AR : CARDS_EN;
  return <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-between pt-20 md:pt-24 pb-6 md:pb-8 px-4 md:px-12 lg:px-24 overflow-x-hidden overflow-y-visible" aria-label="Hero">
      {/* Background handled by global layer in LandingPage */}

      {/* Headline - instant appearance */}
      <div className="w-full max-w-4xl text-center mb-4 md:mb-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            delay: 0,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="font-display font-bold tracking-[-0.02em] text-foreground mb-2 md:mb-3 text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {language === 'ar' ? 'تعرّف على AYN' : language === 'fr' ? 'Découvrez AYN' : 'Meet AYN'}
        </motion.h1>
        {/* Subtitle - quick follow */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4, 
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1]
          }}
          className="text-base md:text-lg lg:text-xl text-muted-foreground font-light max-w-2xl mx-auto"
        >
          {language === 'ar' 
            ? 'رفيقك الذكي الذي يساعدك على التنظيم والتخطيط والعيش بشكل أفضل.' 
            : language === 'fr'
            ? 'Le compagnon intelligent qui vous aide à organiser, planifier et mieux vivre.'
            : 'The intelligent companion that helps you organize, plan, and live better.'}
        </motion.p>
      </div>

      {/* Central area with eye and cards - fast appearance */}
      <motion.div 
        className="relative w-full max-w-5xl flex-1 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5, 
          delay: 0.25,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {/* ring / subtle light behind the eye */}
        <div className="absolute w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] md:w-[360px] md:h-[360px] lg:w-[480px] lg:h-[480px] rounded-full -z-10 pointer-events-none
                        bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

        {/* Floating particles - Phase 4: 2.0s delay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 2.0, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none overflow-visible hidden md:block will-change-transform"
        >
          {/* Particle 1 */}
          <motion.div 
            className="absolute w-2 h-2 rounded-full bg-foreground/15" 
            style={{ top: '20%', left: '30%', x: parallax1X, y: parallax1Y }}
            animate={{ y: [0, -15, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Particle 2 */}
          <motion.div 
            className="absolute w-2.5 h-2.5 rounded-full bg-foreground/10" 
            style={{ top: '15%', right: '25%', x: parallax2X, y: parallax2Y }}
            animate={{ y: [0, 12, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          {/* Particle 3 */}
          <motion.div 
            className="absolute w-1.5 h-1.5 rounded-full bg-foreground/12" 
            style={{ bottom: '25%', left: '20%', x: parallax3X, y: parallax3Y }}
            animate={{ y: [0, -10, 0], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
        </motion.div>

        {/* Cards - optimized animations without blur filters - visible on all devices */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform overflow-visible">
          {/* Top-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 0 && (
              <motion.div 
                key="card-0" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.topLeft.x, y: cardPositions.topLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[0]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Middle-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 1 && (
              <motion.div 
                key="card-1" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.middleLeft.x, y: cardPositions.middleLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[1]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-left card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 2 && (
              <motion.div 
                key="card-2" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.bottomLeft.x, y: cardPositions.bottomLeft.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[2]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Top-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 3 && (
              <motion.div 
                key="card-3" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.topRight.x, y: cardPositions.topRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[3]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Middle-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 4 && (
              <motion.div 
                key="card-4" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.middleRight.x, y: cardPositions.middleRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[4]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-right card */}
          <AnimatePresence mode="popLayout">
            {visibleCardIndex === 5 && (
              <motion.div 
                key="card-5" 
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 0 }}
                animate={{ x: cardPositions.bottomRight.x, y: cardPositions.bottomRight.y, opacity: 1, scale: 1 }}
                exit={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="absolute rounded-2xl bg-background border border-border/40 shadow-lg px-2 sm:px-3 py-1.5 sm:py-2 z-20 max-w-[140px] sm:max-w-none"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-foreground/70 flex-shrink-0" />
                  <span className="text-[10px] sm:text-sm font-medium text-foreground">{CARDS[5]}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Absorption glow - simplified without blur */}
        <AnimatePresence>
          {absorptionPulse && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 0.4 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[200px] lg:h-[200px] rounded-full bg-foreground/8 pointer-events-none z-10" 
            />
          )}
        </AnimatePresence>

        {/* Single pulse ring - simplified */}
        <AnimatePresence mode="wait">
          {visibleCardIndex !== null && (
            <motion.div 
              key={visibleCardIndex} 
              initial={{ scale: 0.6, opacity: 0.3 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] rounded-full border border-foreground/10 pointer-events-none" 
            />
          )}
        </AnimatePresence>

        {/* Eye - Clean minimal design matching dashboard EmotionalEye */}
        <motion.div 
          style={{ x: eyeX, y: eyeY }}
          className="relative z-10 flex items-center justify-center group cursor-pointer will-change-transform" 
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1, opacity: 1 }}
          onMouseEnter={() => setIsHovered(true)} 
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Soft outer glow halo - radial gradient for smooth edges */}
          <div className="absolute -inset-8 rounded-full blur-2xl pointer-events-none bg-[radial-gradient(circle,_rgba(229,229,229,0.3)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle,_rgba(38,38,38,0.15)_0%,_transparent_70%)]" />

          {/* Main eye container - matches EmotionalEye exactly */}
          <motion.div 
            className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden shadow-xl"
            animate={{ scale: [1, 1.01, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Inner shadow for depth */}
            <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.25)]" />

            {/* Neutral ring - matches dashboard calm state */}
            <div className="absolute inset-[15%] rounded-full bg-neutral-200 dark:bg-neutral-700" />

            {/* Iris container with SVG */}
            <motion.svg 
              viewBox="0 0 100 100" 
              className="w-[70%] h-[70%] relative z-10"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                scaleY: isBlinking ? 0.05 : 1,
                opacity: isBlinking ? 0.7 : 1
              }}
              transition={{
                duration: isBlinking ? 0.08 : 0.12,
                ease: isBlinking ? [0.55, 0.055, 0.675, 0.19] : [0.34, 1.56, 0.64, 1]
              }}
              style={{ transformOrigin: 'center center' }}
            >
              {/* Solid black pupil */}
              <circle 
                cx="50" 
                cy="50" 
                r={absorptionPulse ? 22 : isHovered ? 32 : 28}
                fill="#000000"
                style={{
                  transition: absorptionPulse 
                    ? "r 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                    : "r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                }}
              />
              
              {/* Brain icon - centered with flexbox */}
              <foreignObject x="0" y="0" width="100" height="100">
                <div 
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    transition: absorptionPulse 
                      ? "all 0.15s cubic-bezier(0.55, 0.055, 0.675, 0.19)" 
                      : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  }}
                >
                  <Brain 
                    className="text-white/90" 
                    style={{ 
                      width: absorptionPulse ? '28%' : isHovered ? '40%' : '36%',
                      height: absorptionPulse ? '28%' : isHovered ? '40%' : '36%'
                    }}
                  />
                </div>
              </foreignObject>
            </motion.svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Interactive Chat Input */}
      <LandingChatInput onSendAttempt={(message) => onGetStarted(message)} />
    </section>;
};