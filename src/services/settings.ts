import { api } from './api'

export interface SettingDto {
  key: string
  value: string
  description: string | null
  updatedAt: string | null
}

export interface BackupInfo {
  filePath: string
  finishedAtUtc: string
  sizeBytes: number
}

export interface TemplateDto {
  id: number
  centerName: string
  logoPath: string | null
  signerName: string
  signerTitle: string
  bodyText: string
  language: string
  isDefault: boolean
}

export interface TemplateBody {
  centerName: string
  logoPath: string | null
  signerName: string
  signerTitle: string
  bodyText: string
  isDefault: boolean
}

export const settingsApi = {
  list: () => api.get('/settings') as Promise<SettingDto[]>,
  update: (key: string, value: string) =>
    api.put(`/settings/${encodeURIComponent(key)}`, { value }) as Promise<SettingDto>,
}

export const backupsApi = {
  list: (take = 20) => api.get(`/backups?take=${take}`) as Promise<BackupInfo[]>,
  create: () => api.post('/backups', {}) as Promise<BackupInfo>,
}

export const templatesApi = {
  list: () => api.get('/certificate-templates') as Promise<TemplateDto[]>,
  create: (b: TemplateBody & { language: string }) => api.post('/certificate-templates', b) as Promise<TemplateDto>,
  update: (id: number, b: TemplateBody) => api.put(`/certificate-templates/${id}`, b) as Promise<TemplateDto>,
  setDefault: (id: number) => api.post(`/certificate-templates/${id}/default`, {}) as Promise<TemplateDto>,
  remove: (id: number) => api.delete(`/certificate-templates/${id}`) as Promise<unknown>,
}