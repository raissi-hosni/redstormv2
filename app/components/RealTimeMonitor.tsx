'use client';

import { useEffect, useState } from 'react';
import { Clock, Zap, Shield, AlertTriangle } from 'lucide-react';

interface RealTimeMonitorProps {
  data: any[];
  isRunning: boolean;
}

export default function RealTimeMonitor({ data, isRunning }: RealTimeMonitorProps) {
  const [filteredData, setFilteredData] = useState<any[]>([]);

  useEffect(() => {
    // Keep only last 50 entries for performance
    setFilteredData(data.slice(-50));
  }, [data]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'vulnerability':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'phase_started':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'phase_completed':
        return <Shield className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-900/20';
      case 'high': return 'text-orange-400 bg-orange-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Events</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-400">{isRunning ? 'Scanning' : 'Idle'}</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Start an assessment to see live updates</p>
          </div>
        ) : (
          filteredData.map((item, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
              <div className="flex items-start space-x-3">
                {getIconForType(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {item.type === 'vulnerability' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{item.vulnerability_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${getSeverityColor(item.severity)}`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                    </div>
                  )}
                  
                  {item.type === 'phase_started' && (
                    <p className="text-sm text-gray-300">Phase {item.phase} started</p>
                  )}
                  
                  {item.type === 'phase_completed' && (
                    <p className="text-sm text-gray-300">Phase {item.phase} completed</p>
                  )}
                  
                  {item.type === 'agent_update' && item.agent && (
                    <p className="text-sm text-gray-300">Agent {item.agent} update</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}