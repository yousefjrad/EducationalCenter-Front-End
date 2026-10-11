import { api } from './api'
import type { SessionStatus } from './sessions'

export interface AttendanceRowDto {
  enrollmentId: number
  studentId: number
  studentName: string
  isPresent: boolean | null
}

export interface SessionAttendanceDto {
  sessionId: number
  sectionName: string
  date: string
  startTime: string
  endTime: string
  status: SessionStatus
  rows: AttendanceRowDto[]
}

export const attendanceApi = {
  getSession: (sessionId: number) => api.get(`/attendance/sessions/${sessionId}`) as Promise<SessionAttendanceDto>,
  record: (sessionId: number, marks: { enrollmentId: number; isPresent: boolean }[]) =>
    api.put(`/attendance/sessions/${sessionId}`, { marks }) as Promise<SessionAttendanceDto>,
}