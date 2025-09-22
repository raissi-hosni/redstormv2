'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Download, Activity, Shield, AlertTriangle } from 'lucide-react';
import { WebSocketManager } from './lib/websocket';
import { api } from './lib/api';
import RealTimeMonitor from './components/RealTimeMonitor';
import AssessmentForm from './components/AssessmentForm';
import PhaseProgress from './components/PhaseProgress';

export default function Dashboard() {
  const [isConnected, setIsConnected] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<string>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const websocket = new WebSocketManager();

  useEffect(() => {
    // Load initial data
    loadInitialData();
    
    // Connect to WebSocket
    const socket = websocket.connect('dashboard_client');
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🟢 Connected to backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔴 Disconnected from backend');
    });

    socket.on('agent_update', (data) => {
      setRealTimeData(prev => [...prev, { ...data, timestamp: Date.now() }]);
    });

    socket.on('phase_started', (data) => {
      setCurrentPhase(data.phase);
      setRealTimeData(prev => [...prev, { type: 'phase_started', ...data, timestamp: Date.now() }]);
    });

    socket.on('phase_completed', (data) => {
      setRealTimeData(prev => [...prev, { type: 'phase_completed', ...data, timestamp: Date.now() }]);
      if (data.phase === 'exploitation') {
        setIsRunning(false);
        setCurrentPhase('completed');
      }
    });

    socket.on('vulnerability_found', (data) => {
      setRealTimeData(prev => [...prev, { type: 'vulnerability', ...data, timestamp: Date.now() }]);
    });

    socket.on('assessment_completed', (data) => {
      setIsRunning(false);
      setCurrentPhase('completed');
      setRealTimeData(prev => [...prev, { type: 'assessment_completed', ...data, timestamp: Date.now() }]);
    });

    socket.on('assessment_error', (data) => {
      setIsRunning(false);
      setCurrentPhase('error');
      setRealTimeData(prev => [...prev, { type: 'error', ...data, timestamp: Date.now() }]);
    });

    return () => {
      websocket.disconnect();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      const [assessmentsData, statsData, toolsData] = await Promise.all([
        api.getAssessments(),
        api.getStatistics(),
        api.getToolsStatus()
      ]);
      
      setStats(statsData);
      if (assessmentsData.assessments.length > 0) {
        setAssessment(assessmentsData.assessments[0]);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const startAssessment = async (target: string, options: any) => {
    try {
      const result = await api.createAssessment(target, options);
      setAssessment(result);
      setIsRunning(true);
      setCurrentPhase('starting');
      setRealTimeData([]);
      
      // Send start command via WebSocket
      websocket.emit('start_assessment', {
        target: target,
        assessment_id: result.assessment_id,
        options: options
      });
      
    } catch (error) {
      console.error('Failed to start assessment:', error);
    }
  };

  const stopAssessment = async () => {
    try {
      if (assessment?.assessment_id) {
        await api.updateAssessmentStatus(assessment.assessment_id, 'stopped');
        websocket.emit('stop_assessment', { assessment_id: assessment.assessment_id });
        setIsRunning(false);
        setCurrentPhase('stopped');
      }
    } catch (error) {
      console.error('Failed to stop assessment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold">RedStorm Security</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={loadInitialData}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Refresh
            </button>
            <a
              href="/reports"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Reports</span>
            </a>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
          {/* Assessment Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              New Assessment
            </h2>
            <AssessmentForm onSubmit={startAssessment} disabled={isRunning} />
          </div>

          {/* Current Assessment Status */}
          {assessment && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Current Assessment</h3>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Target</span>
                  <span className="text-sm font-medium">{assessment.target}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Status</span>
                  <span className={`text-sm font-medium ${
                    assessment.status === 'completed' ? 'text-green-400' :
                    assessment.status === 'error' ? 'text-red-400' :
                    assessment.status === 'running' ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {assessment.status}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">ID</span>
                  <span className="text-xs font-mono text-gray-400">{assessment.assessment_id?.slice(0, 8)}...</span>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  {!isRunning ? (
                    <button
                      onClick={() => startAssessment(assessment.target, assessment.config)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Play className="h-4 w-4" />
                      <span>Start</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopAssessment}
                      className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Square className="h-4 w-4" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* System Stats */}
          {stats && (
            <div>
              <h3 className="text-lg font-semibold mb-4">System Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Total Assessments</span>
                  <span className="text-sm font-medium">{stats.assessments?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Vulnerabilities</span>
                  <span className="text-sm font-medium">{stats.vulnerabilities?.total || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Active Tools</span>
                  <span className="text-sm font-medium">{stats.tools?.available_tools || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Phase Progress */}
          {isRunning && (
            <div className="mb-6">
              <PhaseProgress currentPhase={currentPhase} isRunning={isRunning} />
            </div>
          )}

          {/* Real-time Monitor */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Real-time Monitor
            </h2>
            <RealTimeMonitor data={realTimeData} isRunning={isRunning} />
          </div>

          {/* Live Results */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Live Results</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Vulnerabilities
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {realTimeData
                    .filter(d => d.type === 'vulnerability')
                    .slice(-10)
                    .map((item, index) => (
                      <div key={index} className="bg-gray-700 rounded p-3">
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{item.vulnerability_name}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.severity === 'critical' ? 'bg-red-600' :
                            item.severity === 'high' ? 'bg-orange-600' :
                            item.severity === 'medium' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{item.description?.slice(0, 100)}...</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-500" />
                  Phase Updates
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {realTimeData
                    .filter(d => d.type === 'phase_started' || d.type === 'phase_completed')
                    .slice(-10)
                    .map((item, index) => (
                      <div key={index} className="bg-gray-700 rounded p-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'phase_started' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <span className="text-sm">
                            {item.type === 'phase_started' ? 'Started' : 'Completed'}: {item.phase}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}