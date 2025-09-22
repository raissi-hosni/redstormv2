'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, Filter, Calendar, Target, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import ReportViewer from '@/components/ReportViewer';

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    severity: '',
    target: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    loadAssessments();
  }, []);

  const loadAssessments = async () => {
    try {
      const data = await api.getAssessments();
      setAssessments(data.assessments);
      if (data.assessments.length > 0) {
        setSelectedAssessment(data.assessments[0]);
        loadVulnerabilities(data.assessments[0].assessment_id);
      }
    } catch (error) {
      console.error('Failed to load assessments:', error);
    }
  };

  const loadVulnerabilities = async (assessmentId: string) => {
    try {
      const data = await api.getVulnerabilities(assessmentId, filters);
      setVulnerabilities(data.findings);
    } catch (error) {
      console.error('Failed to load vulnerabilities:', error);
    }
  };

  const handleAssessmentSelect = (assessment: any) => {
    setSelectedAssessment(assessment);
    loadVulnerabilities(assessment.assessment_id);
  };

  const exportReport = async (format: 'pdf' | 'json' | 'csv') => {
    if (!selectedAssessment) return;

    try {
      const reportData = {
        assessment: selectedAssessment,
        vulnerabilities: vulnerabilities,
        generated_at: new Date().toISOString(),
        format: format
      };

      // Create download link
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redstorm-report-${selectedAssessment.assessment_id}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📄 Report exported as ${format}`);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => exportReport('json')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export PDF</span>
            </button>
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

          {/* Quick Stats */}
          {selectedAssessment && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Target</span>
                  <span className="truncate">{selectedAssessment.target}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span>{selectedAssessment.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span>~5.7s</span>
                </div>
              </div>
            </div>
          )}
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