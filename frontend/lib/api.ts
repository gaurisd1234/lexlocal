import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
})

export interface Clause {
  clause_number: number
  original_text: string
  simple_marathi: string
  risk_level: 'RED' | 'YELLOW' | 'GREEN'
  risk_reason: string
  negotiation_tip: string | null
}

export interface LawyerCardData {
  risk_score: number
  recommendation: string
  reason: string
  dlsa_district: string | null
}

export interface SchemeEligibility {
  scheme_name: string
  eligible: boolean
  reason: string
  apply_url: string
}

export interface AnalyzeResponse {
  document_id: string
  document_type: string
  extracted_text: string
  clauses: Clause[]
  lawyer_card: LawyerCardData
  schemes: SchemeEligibility[]
  audio_url: string | null
  overall_risk: 'RED' | 'YELLOW' | 'GREEN'
}

export interface Difference {
  topic: string
  document_1: string
  document_2: string
  safer: string
  explanation: string
}

export interface CompareResponse {
  document_1_type: string
  document_2_type: string
  differences: Difference[]
  summary: string
  safer_document: string
}

export async function analyzeDocument(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('language', 'mr')
  const response = await api.post<AnalyzeResponse>('/api/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export async function compareDocuments(file1: File, file2: File): Promise<CompareResponse> {
  const formData = new FormData()
  formData.append('file1', file1)
  formData.append('file2', file2)
  const response = await api.post<CompareResponse>('/api/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export function getAudioUrl(documentId: string): string {
  return `${API_BASE}/api/audio/${documentId}`
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await api.get('/health')
    return res.data.status === 'ok'
  } catch {
    return false
  }
}