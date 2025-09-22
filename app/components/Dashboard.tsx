'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target,
  Zap,
  BarChart3,
  TrendingUp,
  Globe,
  Server
} from 'lucide-react';
import RealTimeMonitor from './RealTimeMonitor';
import AssessmentForm from './AssessmentForm';

interface DashboardStats {
  totalScans: number;
  activeScans: number;
  vulnerabilitiesFound: number;
  avgScanTime: string;
  successRate: number;
}

interface RecentScan {
  id: string;
  target: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  phases: string[];
  vulnerabilities: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalScans: 0,
    activeScans: 0,
    vulnerabilitiesFound: 0,
    avgScanTime: '0m',
    successRate: 0
  });

  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isAssessmentRunning, setIsAssessmentRunning] = useState(false);
  const [monitorData, setMonitorData] = useState<any[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
    
    // Setup WebSocket connection for real-time updates
    const clientId = `dashboard_${Date.now()}`;
    const websocket = new WebSocket(`ws://localhost:8000/ws/${clientId}`);
    
    websocket.onopen = () => {
      console.log('Dashboard WebSocket connected');
    };
    
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setWs(websocket);
    
    return () => {
      websocket.close();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/dashboard/stats');
      const data = await response.json();
      setStats(data.stats);
      setRecentScans(data.recentScans);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    setMonitorData(prev => [...prev, data]);
    
    // Update stats based on message type
    if (data.type === 'assessment_started') {
      setIsAssessmentRunning(true);
      setStats(prev => ({
        ...prev,
        activeScans: prev.activeScans + 1,
        totalScans: prev.totalScans + 1
      }));
    } else if (data.type === 'assessment_completed') {
      setIsAssessmentRunning(false);
      setStats(prev => ({
        ...prev,
        activeScans: Math.max(0, prev.activeScans - 1)
      }));
      loadDashboardData(); // Refresh data
    } else if (data.type === 'vulnerability') {
      setStats(prev => ({
        ...prev,
        vulnerabilitiesFound: prev.vulnerabilitiesFound + 1
      }));
    }
  };

  const handleAssessmentSubmit = async (target: string, options: any) => {
    if (!ws) return;
    
    const message = {
      type: 'start_assessment',
      target,
      options
    };
    
    ws.send(JSON.stringify(message));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400">Running</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400">Completed</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-400">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Scans</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              All time scans
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{stats.activeScans}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Vulnerabilities</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats.vulnerabilitiesFound}</div>
            <p className="text-xs text-muted-foreground">
              Total findings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Avg Scan Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScanTime}</div>
            <p className="text-xs text-muted-foreground">
              Per assessment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment Form */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>New Assessment</span>
              </CardTitle>
              <CardDescription>
                Configure and start a new security assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssessmentForm 
                onSubmit={handleAssessmentSubmit}
                disabled={isAssessmentRunning}
              />
            </CardContent>
          </Card>
        </div>

        {/* Real-time Monitor */}
        <div className="lg:col-span-2">
          <RealTimeMonitor 
            data={monitorData}
            isRunning={isAssessmentRunning}
          />
        </div>
      </div>

      {/* Recent Scans */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Recent Scans</span>
          </CardTitle>
          <CardDescription>
            Latest security assessments and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentScans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent scans</p>
                <p className="text-sm">Start your first assessment to see results here</p>
              </div>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(scan.status)}
                    <div>
                      <p className="font-medium">{scan.target}</p>
                      <p className="text-sm text-gray-400">
                        Started {new Date(scan.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Phases</p>
                      <p className="text-sm font-medium">{scan.phases.length}</p>
                    </div>
                    {scan.vulnerabilities > 0 && (
                      <Badge variant="destructive" className="bg-red-600">
                        {scan.vulnerabilities} vulns
                      </Badge>
                    )}
                    {getStatusBadge(scan.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}