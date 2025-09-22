'use client';

import { useState } from 'react';
import { Play, Settings, Clock, Shield, AlertTriangle,Target } from 'lucide-react';

interface AssessmentFormProps {
  onSubmit: (target: string, options: any) => void;
  disabled?: boolean;
}

export default function AssessmentForm({ onSubmit, disabled }: AssessmentFormProps) {
  const [target, setTarget] = useState('scanme.nmap.org');
  const [intensity, setIntensity] = useState('medium');
  const [timeout, setTimeout] = useState(300);
  const [selectedPhases, setSelectedPhases] = useState<string[]>([
    'reconnaissance',
    'scanning',
    'vulnerability'
  ]);

  const phases = [
    { id: 'reconnaissance', name: 'Reconnaissance', icon: '🔍', description: 'Domain enumeration & info gathering' },
    { id: 'scanning', name: 'Scanning', icon: '🛡️', description: 'Port scanning & service detection' },
    { id: 'vulnerability', name: 'Vulnerability', icon: '🚨', description: 'CVE lookup & vulnerability scanning' },
    { id: 'exploitation', name: 'Exploitation', icon: '⚠️', description: 'Safe exploit simulation' }
  ];

  const intensityOptions = [
    { value: 'low', label: 'Low', color: 'text-green-400', description: 'Quick scan, basic checks' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400', description: 'Balanced scan, thorough checks' },
    { value: 'high', label: 'High', color: 'text-red-400', description: 'Deep scan, comprehensive analysis' }
  ];

  const handlePhaseToggle = (phaseId: string) => {
    setSelectedPhases(prev => 
      prev.includes(phaseId) 
        ? prev.filter(p => p !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!target.trim()) {
      alert('Please enter a target');
      return;
    }

    if (selectedPhases.length === 0) {
      alert('Please select at least one phase');
      return;
    }

    const options = {
      timeout,
      intensity,
      phases: selectedPhases,
      reconnaissance: {
        subdomain_enum: true,
        tech_detection: true,
        whois_lookup: true,
        dns_enumeration: selectedPhases.includes('reconnaissance')
      },
      scanning: {
        port_scan: true,
        service_detection: true,
        ssl_analysis: true,
        os_detection: intensity === 'high',
        aggressive: intensity === 'high'
      },
      vulnerability: {
        cve_lookup: true,
        service_checks: true,
        web_scan: true,
        ssl_tests: true,
        comprehensive: intensity === 'high'
      },
      exploitation: {
        simulation_mode: true,
        safe_exploits: true,
        poc_generation: intensity === 'high',
        impact_assessment: true,
        ...(selectedPhases.includes('exploitation') ? {} : { skip: true })
      }
    };

    onSubmit(target.trim(), options);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target Input */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center">
          <Target className="h-4 w-4 mr-2" />
          Target
        </label>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="scanme.nmap.org"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-400 text-white"
          disabled={disabled}
        />
        <p className="text-xs text-gray-400 mt-1">
          Domain, IP address, or hostname to scan
        </p>
      </div>

      {/* Phase Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Security Phases</label>
        <div className="grid grid-cols-1 gap-3">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPhases.includes(phase.id)
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => handlePhaseToggle(phase.id)}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{phase.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{phase.name}</h4>
                    {selectedPhases.includes(phase.id) && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{phase.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intensity Selection */}
      <div>
        <label className="block text-sm font-medium mb-3 flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Scan Intensity
        </label>
        <div className="grid grid-cols-3 gap-3">
          {intensityOptions.map((option) => (
            <div
              key={option.value}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                intensity === option.value
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => setIntensity(option.value)}
            >
              <div className="text-center">
                <div className={`text-lg font-semibold ${option.color}`}>
                  {option.label}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeout Setting */}
      <div>
        <label className="block text-sm font-medium mb-2 flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Timeout (seconds)
        </label>
        <input
          type="number"
          value={timeout}
          onChange={(e) => setTimeout(Number(e.target.value))}
          min="60"
          max="3600"
          step="60"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     text-white"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Min: 60s</span>
          <span>Max: 3600s (1 hour)</span>
        </div>
      </div>

      {/* Security Warning */}
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-medium mb-1">Security Notice</h4>
            <p className="text-yellow-200 text-sm">
              Only scan targets you own or have explicit permission to test. 
              This tool is for authorized security assessments only.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled || selectedPhases.length === 0}
        className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all flex items-center justify-center space-x-2 ${
          disabled || selectedPhases.length === 0
            ? 'bg-gray-600 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
        }`}
      >
        <Play className="h-5 w-5" />
        <span>Start Security Assessment</span>
      </button>
    </form>
  );
}