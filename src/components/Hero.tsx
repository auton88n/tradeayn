import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, useMotionValue, useTransform } from 'framer-motion';

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

  // track pointer relative to container center for subtle eye follow
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const eyeX = useTransform(mouseX, (v) => v * 0.12); // subtle follow
  const eyeY = useTransform(mouseY, (v) => v * 0.12);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set(e.clientX - cx);
      mouseY.set(e.clientY - cy);
    }
    function onLeave() {
      mouseX.set(0);
      mouseY.set(0);
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

        {/* Cards row - positioned absolutely to avoid cutoffs */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Left card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7 }}
            className="absolute left-6 md:left-16 lg:left-24 top-1/2 -translate-y-1/2 w-[170px] md:w-[220px] rounded-2xl backdrop-blur-xl bg-background/55 border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-4 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[0]}
            </div>
          </motion.div>

          {/* Top card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="absolute -top-12 md:-top-16 lg:-top-20 left-1/2 -translate-x-1/2 w-[150px] md:w-[200px] rounded-2xl backdrop-blur-xl bg-background/55 border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-3 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[1]}
            </div>
          </motion.div>

          {/* Right card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="absolute right-6 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 w-[170px] md:w-[220px] rounded-2xl backdrop-blur-xl bg-background/55 border border-border/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-4 z-20 transition-all duration-300 hover:scale-105 hover:backdrop-blur-2xl hover:bg-background/65 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] cursor-pointer"
          >
            <div className="text-sm md:text-base font-medium text-foreground">
              {CARDS[2]}
            </div>
          </motion.div>
        </div>

        {/* Eye - centered */}
        <motion.div
          style={{ x: eyeX, y: eyeY }}
          className="relative z-10 flex items-center justify-center"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Outer casing */}
          <div className="relative w-[160px] h-[160px] md:w-[220px] md:h-[220px] lg:w-[260px] lg:h-[260px] rounded-full bg-background shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex items-center justify-center">
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

              {/* iris / pupil */}
              <circle
                cx="50"
                cy="50"
                r="28"
                fill="url(#g1)"
                style={{ transition: "transform 0.12s ease-out" }}
              />
              {/* highlight */}
              <circle cx="64" cy="40" r="6" fill="hsl(var(--background))" opacity="0.95" />
            </svg>
          </div>
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
