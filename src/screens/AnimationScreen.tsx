import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TEAM_COLORS } from '../types';
import { playRollSound } from '../lib/sounds';

const ENVELOPE_COLORS = [
  'from-pink-400 to-pink-600',
  'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-yellow-400 to-yellow-600',
  'from-orange-400 to-orange-600',
  'from-cyan-400 to-cyan-600',
  'from-red-400 to-red-600',
];

export function AnimationScreen() {
  const { state, goToResult } = useApp();
  const { currentResult, soundEnabled } = state;
  const [phase, setPhase] = useState<'intro' | 'shuffling' | 'reveal'>('intro');
  const [revealed, setRevealed] = useState(false);
  const soundPlayedRef = useRef(false);

  // Animation sequence
  useEffect(() => {
    // Phase 1: Intro (0.3s pause)
    const t1 = setTimeout(() => setPhase('shuffling'), 300);

    // Phase 2: Shuffling animation (2s)
    const t2 = setTimeout(() => {
      setPhase('reveal');
      if (soundEnabled && !soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playRollSound();
      }
    }, 800);

    // Phase 3: Reveal (after roll sound ~1.5s)
    const t3 = setTimeout(() => {
      setRevealed(true);
    }, 2500);

    // Phase 4: Go to result
    const t4 = setTimeout(() => {
      goToResult();
    }, 3800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [soundEnabled, goToResult]);

  if (!currentResult) return null;

  // Flatten all names for animation
  const allNames = currentResult.teams.flatMap(t => t.members.map(m => ({
    ...m,
    teamId: t.id,
  })));

  return (
    <div className="min-h-dvh bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Particles background */}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.h2
        className="text-3xl font-display text-white mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {phase === 'intro' && 'Preparando...'}
        {phase === 'shuffling' && '🎲 Sorteando...'}
        {phase === 'reveal' && '✨ Resultado!'}
      </motion.h2>

      {/* Envelopes */}
      {phase !== 'reveal' && (
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl relative z-10">
          <AnimatePresence>
            {allNames.map((person, i) => (
              <motion.div
                key={person.id}
                className={`
                  w-16 h-20 rounded-xl bg-gradient-to-br ${ENVELOPE_COLORS[i % ENVELOPE_COLORS.length]}
                  flex items-center justify-center shadow-lg cursor-pointer
                  relative overflow-hidden
                `}
                initial={{ opacity: 0, scale: 0, rotateY: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotateY: phase === 'shuffling' ? [0, 180, 360, 180, 360] : 0,
                  x: phase === 'shuffling' ? [0, Math.random() * 20 - 10, Math.random() * -15 + 5, 0] : 0,
                  y: phase === 'shuffling' ? [0, Math.random() * -10, Math.random() * 10, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  rotateY: {
                    duration: 0.8,
                    repeat: phase === 'shuffling' ? 2 : 0,
                    ease: 'easeInOut',
                  },
                }}
              >
                {/* Envelope icon */}
                <motion.span
                  className="text-2xl"
                  animate={{ scale: phase === 'shuffling' ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3, repeat: phase === 'shuffling' ? Infinity : 0 }}
                >
                  ✉️
                </motion.span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Reveal: Show teams */}
      {phase === 'reveal' && (
        <motion.div
          className="relative z-10 w-full max-w-4xl px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentResult.teams.map((team, idx) => {
              const colors = TEAM_COLORS[idx % TEAM_COLORS.length];
              return (
                <motion.div
                  key={team.id}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20"
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <h3 className="text-lg font-display text-white mb-3 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full inline-block"
                      style={{ backgroundColor: colors.hex }}
                    />
                    {team.emoji} {team.name}
                  </h3>
                  <div className="space-y-1">
                    {team.members.map(m => {
                      const isCaptain = team.captain?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          className={`text-sm ${isCaptain ? 'text-yellow-300 font-bold' : 'text-white/80'}`}
                        >
                          {isCaptain ? '👑 ' : ''}{m.name}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Loading spinner during shuffle */}
      {phase === 'shuffling' && (
        <motion.div
          className="mt-8 relative z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Shuffle size={32} className="text-white/50" />
        </motion.div>
      )}
    </div>
  );
}
