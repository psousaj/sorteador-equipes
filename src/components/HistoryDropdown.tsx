import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { MatchResult } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchHistory: MatchResult[];
}

export function HistoryDropdown({ isOpen, onClose, matchHistory }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">📋 Histórico</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {matchHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                Nenhuma partida disputada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {matchHistory.map((match, idx) => (
                  <div
                    key={match.id}
                    className="bg-gray-50 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="text-sm text-gray-700 flex-1 min-w-0">
                      <span className="font-medium truncate">{match.team1Name}</span>
                      <span className="text-gray-400 mx-1">vs</span>
                      <span className="font-medium truncate">{match.team2Name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <span className={`text-sm font-bold tabular-nums ${
                        match.winner === 'team1' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {match.score1} × {match.score2}
                      </span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        Partida {idx + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
