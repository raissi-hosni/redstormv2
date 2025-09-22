const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  // Assessment management
  async createAssessment(target: string, options: any) {
    const response = await fetch(`${API_URL}/api/v1/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, ...options })
    });
    return response.json();
  },

  async getAssessments() {
    const response = await fetch(`${API_URL}/api/v1/assessments`);
    return response.json();
  },

  async getAssessment(id: string) {
    const response = await fetch(`${API_URL}/api/v1/assessments/${id}`);
    return response.json();
  },

  async updateAssessmentStatus(id: string, status: string) {
    const response = await fetch(`${API_URL}/api/v1/assessments/${id}/status?status=${status}`, {
      method: 'PUT'
    });
    return response.json();
  },

  // Tools & validation
  async validateTarget(target: string) {
    const response = await fetch(`${API_URL}/api/v1/validate-target`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    });
    return response.json();
  },

  async validateConsent(target: string, consentData: any) {
    const response = await fetch(`${API_URL}/api/v1/consent/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, ...consentData })
    });
    return response.json();
  },

  // Results & reports
  async getVulnerabilities(assessmentId?: string, filters?: any) {
    const params = new URLSearchParams();
    if (assessmentId) params.append('assessment_id', assessmentId);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.target) params.append('target', filters.target);
    
    const response = await fetch(`${API_URL}/api/v1/vulnerabilities?${params}`);
    return response.json();
  },

  async getStatistics() {
    const response = await fetch(`${API_URL}/api/v1/statistics`);
    return response.json();
  },

  async getToolsStatus() {
    const response = await fetch(`${API_URL}/api/v1/tools/status`);
    return response.json();
  }
};