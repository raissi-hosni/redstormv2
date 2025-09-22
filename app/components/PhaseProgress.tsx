'use client';

import { useEffect, useState } from 'react';
import * as Progress from '@radix-ui/react-progress';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PhaseProgressProps {
  currentPhase: string;
  isRunning: boolean;
}

const phases = [
  { id: 'reconnaissance', name: 'Reconnaissance', icon: '🔍' },
  { id: 'scanning', name: 'Scanning', icon: '🛡️' },
  { id: 'vulnerability', name: 'Vulnerability', icon: '🚨' },
  { id: 'exploitation', name: 'Exploitation', icon: '⚠️' }
];

export default function PhaseProgress({ currentPhase, isRunning }: PhaseProgressProps) {
  const [progress, setProgress] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) {
      setProgress(0);
      setCompletedPhases([]);
      return;
    }

    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    if (currentIndex >= 0) {
      setProgress(((currentIndex + 1) / phases.length) * 100);
      
      // Mark previous phases as completed
      const completed = phases.slice(0, currentIndex).map(p => p.id);
      setCompletedPhases(completed);
    }
  }, [currentPhase, isRunning]);

  const getPhaseStatus = (phaseId: string) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (phaseId === currentPhase) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Phase Progress</h3>
        <div className="flex items-center space-x-2">
          <Progress.Root
            className="bg-gray-700 rounded-full w-32 h-2 overflow-hidden"
            value={progress}
            max={100}
          >
            <Progress.Indicator
              className="bg-blue-500 w-full h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${100 - progress}%)` }}
            />
          </Progress.Root>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase.id);
          
          return (
            <div
              key={phase.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                status === 'completed'
                  ? 'bg-green-900/20 border-green-500'
                  : status === 'active'
                  ? 'bg-blue-900/20 border-blue-500 animate-pulse'
                  : 'bg-gray-700 border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{phase.icon}</div>
                <div className="text-sm font-medium mb-1">{phase.name}</div>
                <div className="flex items-center justify-center">
                  {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {status === 'active' && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
                  {status === 'pending' && <AlertCircle className="h-5 w-5 text-gray-500" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}