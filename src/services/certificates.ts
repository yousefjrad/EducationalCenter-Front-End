import { api, getAccessToken } from './api'

export interface GradeDto {
  id: number
  enrollmentId: number
  studentId: number
  studentName: string
  sectionName: string
  score: number
  maxScore: number
  percentage: number
  isPassed: boolean
}

export interface CertificateDto {
  id: number
  enrollmentId: number
  studentId: number
  studentName: string
  courseName: string
  sectionName: string
  certificateNumber: string
  issuedAt: string
  isOverride: boolean
  overrideReason: string | null
}

export interface EligibilityDto {
  enrollmentId: number
  alreadyIssued: boolean
  isEligible: boolean
  blockers: string[]
}

export interface CertificatesPage {
  items: CertificateDto[]
  totalCount?: number
  total?: number
}

export const gradesApi = {
  bySection: (sectionId: number) => api.get(`/grades/sections/${sectionId}`) as Promise<GradeDto[]>,
  record: (enrollmentId: number, score: number, maxScore = 100) =>
    api.put('/grades', { enrollmentId, score, maxScore }) as Promise<GradeDto>,
}

export const certificatesApi = {
  list: (q: { sectionId?: number; page?: number; pageSize?: number }) => {
    const p = new URLSearchParams()
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined) p.set(k, String(v)) })
    return api.get(`/certificates?${p.toString()}`) as Promise<CertificatesPage>
  },
  eligibility: (enrollmentId: number) =>
    api.get(`/certificates/enrollments/${enrollmentId}/eligibility`) as Promise<EligibilityDto>,
  issue: (enrollmentId: number) =>
    api.post(`/certificates/enrollments/${enrollmentId}/issue`, {}) as Promise<CertificateDto>,
  issueOverride: (enrollmentId: number, reason: string) =>
    api.post(`/certificates/enrollments/${enrollmentId}/issue-override`, { reason }) as Promise<CertificateDto>,
}

/** Downloads a PDF (e.g. /certificates/5/pdf?language=ar) with the access token and opens it in a new tab. */
export async function openPdf(path: string) {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const res = await fetch(`${base}${path}`, { headers: { Authorization: `Bearer ${getAccessToken()}` } })
  if (!res.ok) throw new Error(String(res.status))
  const url = URL.createObjectURL(await res.blob())
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}