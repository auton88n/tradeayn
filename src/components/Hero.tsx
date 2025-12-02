import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface HeroProps {
  onGetStarted: () => void;
}

const CARDS_EN = [
  "Always aware.",
  "Understands context.",
  "Ready to assist.",
];

const CARDS_AR = [
  "دائماً يقظ.",
  "يفهم السياق.",
  "جاهز للمساعدة.",
];

export const Hero = ({ onGetStarted }: HeroProps) => {
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [activeCard, setActiveCard] = useState<'left' | 'top' | 'right' | null>(null);

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

  // Parallax transforms for floating particles (different speeds for depth)
  const parallax1X = useTransform(mouseX, (v) => v * 0.02);
  const parallax1Y = useTransform(mouseY, (v) => v * 0.02);
  const parallax2X = useTransform(mouseX, (v) => v * 0.035);
  const parallax2Y = useTransform(mouseY, (v) => v * 0.035);
  const parallax3X = useTransform(mouseX, (v) => v * 0.015);
  const parallax3Y = useTransform(mouseY, (v) => v * 0.015);
  const parallax4X = useTransform(mouseX, (v) => v * 0.028);
  const parallax4Y = useTransform(mouseY, (v) => v * 0.028);
  const parallax5X = useTransform(mouseX, (v) => v * 0.022);
  const parallax5Y = useTransform(mouseY, (v) => v * 0.022);
  const parallax6X = useTransform(mouseX, (v) => v * 0.032);
  const parallax6Y = useTransform(mouseY, (v) => v * 0.032);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // Scale down the movement for subtle effect
      const rawX = (e.clientX - cx) * 0.12;
      const rawY = (e.clientY - cy) * 0.12;
      mouseX.set(rawX);
      mouseY.set(rawY);

      // Determine which card the eye is looking at based on direction
      // Use unscaled values for better threshold detection
      const unscaledX = e.clientX - cx;
      const unscaledY = e.clientY - cy;
      
      if (Math.abs(unscaledX) > Math.abs(unscaledY)) {
        // Horizontal direction dominates
        if (unscaledX < -100) {
          setActiveCard('left');
        } else if (unscaledX > 100) {
          setActiveCard('right');
        } else {
          setActiveCard(null);
        }
      } else {
        // Vertical direction dominates
        if (unscaledY < -100) {
          setActiveCard('top');
        } else {
          setActiveCard(null);
        }
      }
    }
    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
      setActiveCard(null);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [mouseX, mouseY]);

  const CARDS = language === 'ar' ? CARDS_AR : CARDS_EN;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center py-24 px-6 md:px-12 lg:px-24 overflow-hidden"
      aria-label="Hero"
    >
      {/* Subtle vignette / soft gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/10" />

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-4xl text-center mb-12"
      >
        <h1 className="text-6xl md:text-7xl lg:text-8xl leading-[0.9] font-display tracking-tight text-foreground drop-shadow-[0_20px_40px_rgba(0,0,0,0.06)]">
          {language === 'ar' ? (
            <>تعرّف على <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
          ) : (
            <>Meet <span className="text-neutral-500 dark:text-neutral-400">AYN</span></>
          )}
        </h1>
        <p className="mt-6 text-lg md:text-2xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto font-light">
          {language === 'ar'
            ? 'الذكاء الاصطناعي الذي يرى، يسمع، ويفهم عالمك'
            : 'The AI that sees, listens, and understands your world.'}
        </p>
      </motion.div>

      {/* Central area with eye and cards */}
      <div className="relative w-full max-w-5xl mt-8 flex items-center justify-center">
        {/* ring / subtle light behind the eye */}
        <div className="absolute w-[420px] h-[420px] md:w-[520px] md:h-[520px] lg:w-[640px] lg:h-[640px] rounded-full -z-10 pointer-events-none
                        bg-gradient-to-b from-transparent via-muted/30 to-transparent" />

        {/* Floating particles around eye */}
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {/* Particle 1 */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-foreground/10 blur-[1px]"
            style={{ top: '20%', left: '30%', x: parallax1X, y: parallax1Y }}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          {/* Particle 2 */}
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-foreground/8 blur-[2px]"
            style={{ top: '15%', right: '25%', x: parallax2X, y: parallax2Y }}
            animate={{
              y: [0, 40, 0],
              x: [0, -25, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          {/* Particle 3 */}
          <motion.div
            className="absolute w-1.5 h-1.5 rounded-full bg-foreground/12 blur-[1px]"
            style={{ bottom: '25%', left: '20%', x: parallax3X, y: parallax3Y }}
            animate={{
              y: [0, -20, 0],
              x: [0, 15, 0],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          {/* Particle 4 */}
          <motion.div
            className="absolute w-2.5 h-2.5 rounded-full bg-foreground/10 blur-[2px]"
            style={{ bottom: '30%', right: '22%', x: parallax4X, y: parallax4Y }}
            animate={{
              y: [0, 35, 0],
              x: [0, -18, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          {/* Particle 5 */}
          <motion.div
            className="absolute w-1 h-1 rounded-full bg-foreground/15 blur-[1px]"
            style={{ top: '40%', left: '15%', x: parallax5X, y: parallax5Y }}
            animate={{
              y: [0, -25, 0],
              x: [0, 12, 0],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          {/* Particle 6 */}
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-foreground/8 blur-[2px]"
            style={{ top: '45%', right: '18%', x: parallax6X, y: parallax6Y }}
            animate={{
              y: [0, 28, 0],
              x: [0, -22, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />
        </div>

        {/* Cards row - positioned absolutely to avoid cutoffs */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Left card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: activeCard === 'left' ? 1.08 : 1,
            }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className={`absolute left-6 md:left-16 lg:left-24 top-1/2 -translate-y-1/2 w-[170px] md:w-[220px] rounded-2xl backdrop-blur-xl bg-background/55 border p-4 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 cursor-pointer ${
              activeCard === 'left' 
                ? 'border-foreground/40 shadow-[0_0_30px_rgba(0,0,0,0.2),0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(255,255,255,0.25),0_15px_40px_rgba(0,0,0,0.4)]' 
                : 'border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[0]}
            </div>
          </motion.div>

          {/* Top card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: activeCard === 'top' ? 1.08 : 1,
            }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className={`absolute -top-12 md:-top-16 lg:-top-20 left-1/2 -translate-x-1/2 w-[150px] md:w-[200px] rounded-2xl backdrop-blur-xl bg-background/55 border p-3 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 cursor-pointer ${
              activeCard === 'top' 
                ? 'border-foreground/40 shadow-[0_0_30px_rgba(0,0,0,0.2),0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(255,255,255,0.25),0_15px_40px_rgba(0,0,0,0.4)]' 
                : 'border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[1]}
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: activeCard === 'right' ? 1.08 : 1,
            }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className={`absolute right-6 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-[170px] md:w-[220px] rounded-2xl backdrop-blur-xl bg-background/55 border p-4 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 cursor-pointer ${
              activeCard === 'right' 
                ? 'border-foreground/40 shadow-[0_0_30px_rgba(0,0,0,0.2),0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(255,255,255,0.25),0_15px_40px_rgba(0,0,0,0.4)]' 
                : 'border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)]'
            }`}
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[2]}
            </div>
          </motion.div>
        </div>

        {/* Eye - centered with spring physics */}
        <motion.div
          style={{ x: eyeX, y: eyeY }}
          className="relative z-10 flex items-center justify-center group cursor-pointer"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer casing with breathing pulse and hover glow */}
          <motion.div 
            className="relative w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px] rounded-full bg-background flex items-center justify-center transition-all duration-500 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.15),0_0_60px_rgba(0,0,0,0.08)] dark:group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_60px_rgba(255,255,255,0.15)] group-hover:scale-105 overflow-hidden"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Shine sweep effect */}
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.6) 50%, transparent 70%)',
                animation: 'eye-shine 6s ease-in-out infinite',
                animationDelay: '2s',
              }}
            />
            {/* soft inner ring */}
            <div className="absolute inset-4 rounded-full bg-background/80 shadow-inner"></div>

            {/* actual eye (pupil + iris) */}
            <svg
              viewBox="0 0 100 100"
              className="w-[70%] h-[70%] relative"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: 'eye-blink 4s ease-in-out infinite',
                transformOrigin: 'center center'
              }}
            >
              {/* iris subtle gradient */}
              <defs>
                <radialGradient id="g1" cx="50%" cy="40%">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.12" />
                  <stop offset="45%" stopColor="hsl(var(--foreground))" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.9" />
                </radialGradient>
                <radialGradient id="g2" cx="40%" cy="30%">
                  <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.9" />
                  <stop offset="80%" stopColor="hsl(var(--foreground))" stopOpacity="0.95" />
                </radialGradient>
              </defs>

              {/* sclera subtle */}
              <circle cx="50" cy="50" r="48" fill="url(#g2)" opacity="0.06" />

              {/* iris / pupil - dilates on hover */}
              <circle
                cx="50"
                cy="50"
                r={isHovered ? "32" : "28"}
                fill="url(#g1)"
                style={{ 
                  transition: "r 0.3s cubic-bezier(0.32, 0.72, 0, 1), transform 0.12s ease-out" 
                }}
              />
              {/* highlight */}
              <circle cx="64" cy="40" r="6" fill="hsl(var(--background))" opacity="0.95" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="mt-16"
      >
        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-14 px-10 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {language === 'ar' ? 'جرّب AYN الآن' : 'Experience AYN'}
          <ArrowRight className={language === 'ar' ? 'mr-3 w-5 h-5' : 'ml-3 w-5 h-5'} />
        </Button>
      </motion.div>
    </section>
  );
};
