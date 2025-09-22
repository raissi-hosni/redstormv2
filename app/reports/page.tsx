'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Target, AlertCircle } from 'lucide-react';
import ReportViewer from '../components/ReportViewer';

interface Assessment {
  assessment_id: string;
  target: string;
  status: string;
  created_at: string;
  phases?: string[];
}

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      // Mock data for demo - replace with actual API call
      const mockAssessments: Assessment[] = [
        {
          assessment_id: 'assessment-123',
          target: 'scanme.nmap.org',
          status: 'completed',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          phases: ['reconnaissance', 'scanning', 'vulnerability']
        },
        {
          assessment_id: 'assessment-456',
          target: 'example.com',
          status: 'completed',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          phases: ['reconnaissance', 'scanning']
        }
      ];
      
      setAssessments(mockAssessments);
      if (mockAssessments.length > 0) {
        setSelectedAssessment(mockAssessments[0]);
        loadVulnerabilities(mockAssessments[0].assessment_id);
      }
    } catch (error) {
      console.error('Failed to load assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVulnerabilities = async (assessmentId: string) => {
    try {
      // Mock vulnerabilities data - replace with actual API call
      const mockVulnerabilities = [
        {
          id: 'vuln-1',
          name: 'SSH Weak Configuration',
          severity: 'high',
          description: 'SSH service allows weak authentication methods',
          affected_service: 'ssh',
          port: 22,
          discovered_at: new Date(Date.now() - 3500000).toISOString()
        },
        {
          id: 'vuln-2',
          name: 'Outdated Apache Version',
          severity: 'medium',
          description: 'Apache HTTP Server version has known vulnerabilities',
          affected_service: 'http',
          port: 80,
          discovered_at: new Date(Date.now() - 3400000).toISOString()
        }
      ];
      setVulnerabilities(mockVulnerabilities);
    } catch (error) {
      console.error('Failed to load vulnerabilities:', error);
    }
  };

  const handleAssessmentSelect = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    loadVulnerabilities(assessment.assessment_id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Assessment List */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Assessments
            </h2>
            
            <div className="space-y-3">
              {assessments.map((assessment) => (
                <div
                  key={assessment.assessment_id}
                  onClick={() => handleAssessmentSelect(assessment)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedAssessment?.assessment_id === assessment.assessment_id
                      ? 'bg-blue-600 border border-blue-500'
                      : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium truncate">{assessment.target}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      assessment.status === 'completed' ? 'bg-green-600' :
                      assessment.status === 'error' ? 'bg-red-600' :
                      assessment.status === 'running' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <span>ID:</span>
                      <span className="font-mono">{assessment.assessment_id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phases:</span>
                      <span>{assessment.phases?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedAssessment ? (
            <ReportViewer 
              assessment={selectedAssessment}
              vulnerabilities={vulnerabilities}
              onRefresh={() => loadVulnerabilities(selectedAssessment.assessment_id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">No Assessment Selected</h2>
                <p className="text-gray-500">Select an assessment from the sidebar to view detailed reports</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}