'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Filter, Calendar, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Search 
} from 'lucide-react';

interface Vulnerability {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  affected_service: string;
  port?: number;
  cve?: string;
  remediation?: string;
  discovered_at: string;
}

interface ScanPhase {
  name: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  start_time: string;
  end_time?: string;
  findings_count: number;
  error?: string;
}

interface Assessment {
  assessment_id: string;
  target: string;
  status: string;
  created_at: string;
  phases?: string[];
  summary?: {
    total_vulnerabilities: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
  };
}

interface ReportViewerProps {
  assessment: Assessment;
  vulnerabilities: Vulnerability[];
  onRefresh: () => Promise<void>;
}

export default function ReportViewer({ assessment, vulnerabilities, onRefresh }: ReportViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      case 'info': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-400';
      case 'running': return 'text-blue-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    const matchesSearch = vuln.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vuln.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || vuln.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const exportReport = async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const reportData = {
        assessment: assessment,
        vulnerabilities: vulnerabilities,
        generated_at: new Date().toISOString(),
        format: format
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redstorm-report-${assessment.assessment_id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📄 Report exported as ${format}`);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const totalVulnerabilities = vulnerabilities.length;
  const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
  const mediumCount = vulnerabilities.filter(v => v.severity === 'medium').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Assessment Report</h1>
          <p className="text-gray-400 mt-1">{assessment.target}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('json')}
            className="border-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportReport('pdf')}
            className="border-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="border-gray-600"
          >
            <Shield className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Executive Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{totalVulnerabilities}</div>
              <p className="text-sm text-gray-400 mt-1">Total Vulnerabilities</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
              <p className="text-sm text-gray-400 mt-1">Critical</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{highCount}</div>
              <p className="text-sm text-gray-400 mt-1">High</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{mediumCount}</div>
              <p className="text-sm text-gray-400 mt-1">Medium</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Assessment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Target:</span>
              <span className="text-white">{assessment.target}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={getStatusColor(assessment.status)}>{assessment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-white">{new Date(assessment.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Assessment ID:</span>
              <span className="text-white font-mono text-sm">{assessment.assessment_id}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Vulnerability Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total:</span>
              <span className="text-white">{totalVulnerabilities}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Critical:</span>
              <span className="text-red-400">{criticalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">High:</span>
              <span className="text-orange-400">{highCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Medium:</span>
              <span className="text-yellow-400">{mediumCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Low:</span>
              <span className="text-blue-400">{lowCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vulnerabilities List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Vulnerabilities</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVulnerabilities.map((vuln) => (
              <div
                key={vuln.id}
                className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedVulnerability(vuln)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-white">{vuln.name}</h3>
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity.toUpperCase()}
                      </Badge>
                      {vuln.port && (
                        <Badge variant="outline">Port {vuln.port}</Badge>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{vuln.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span>{vuln.affected_service}</span>
                      {vuln.cve && <span>CVE: {vuln.cve}</span>}
                      <span>Discovered: {new Date(vuln.discovered_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVulnerabilities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No vulnerabilities found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vulnerability Detail Modal */}
      {selectedVulnerability && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-800 border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedVulnerability.name}</span>
                <Badge className={getSeverityColor(selectedVulnerability.severity)}>
                  {selectedVulnerability.severity.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Description</h4>
                <p className="text-gray-400">{selectedVulnerability.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">Affected Service</h4>
                  <p className="text-gray-400">{selectedVulnerability.affected_service}</p>
                </div>
                {selectedVulnerability.port && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Port</h4>
                    <p className="text-gray-400">{selectedVulnerability.port}</p>
                  </div>
                )}
                {selectedVulnerability.cve && (
                  <div>
                    <h4 className="font-semibold text-gray-300 mb-2">CVE</h4>
                    <p className="text-gray-400">{selectedVulnerability.cve}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">Discovered</h4>
                  <p className="text-gray-400">{new Date(selectedVulnerability.discovered_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedVulnerability.remediation && (
                <div>
                  <h4 className="font-semibold text-gray-300 mb-2">Remediation</h4>
                  <p className="text-gray-400">{selectedVulnerability.remediation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}