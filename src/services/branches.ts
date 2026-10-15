import { api } from '@/services/api'

export interface BranchDto {
  id: number
  name: string
  code: string
  governorate: string | null
  address: string | null
  phone: string | null
  isActive: boolean
}

export interface BranchInput {
  name: string
  governorate: string | null
  address: string | null
  phone: string | null
}

export interface BranchCourseDto {
  courseId: number
  code: string
  name: string
  defaultPrice: number
  courseIsActive: boolean
  isActive: boolean
}

export interface BranchTrainerDto {
  trainerId: number
  fullName: string
  specialty: string | null
  isActive: boolean
}

export const branchesApi = {
  list: async (): Promise<BranchDto[]> => {
    const r = await api.get<BranchDto[] | { items: BranchDto[] }>('/branches', { pageSize: 100 })
    return Array.isArray(r) ? r : r.items
  },
  create: (body: BranchInput & { code: string }) => api.post<BranchDto>('/branches', body),
  update: (id: number, body: BranchInput) => api.put<BranchDto>('/branches/' + id, body),
  close: (id: number) => api.post<BranchDto>('/branches/' + id + '/close'),
  reopen: (id: number) => api.post<BranchDto>('/branches/' + id + '/reopen'),
  courses: (id: number) => api.get<BranchCourseDto[]>('/branches/' + id + '/courses'),
  enableCourse: (id: number, courseId: number) => api.put<BranchCourseDto>('/branches/' + id + '/courses/' + courseId),
  disableCourse: (id: number, courseId: number) => api.delete<BranchCourseDto>('/branches/' + id + '/courses/' + courseId),
  trainers: (id: number) => api.get<BranchTrainerDto[]>('/branches/' + id + '/trainers'),
  addTrainer: (id: number, trainerId: number) => api.put<BranchTrainerDto>('/branches/' + id + '/trainers/' + trainerId),
  removeTrainer: (id: number, trainerId: number) => api.delete('/branches/' + id + '/trainers/' + trainerId),
}