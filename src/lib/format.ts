import type { Lang } from './i18n'

// ---------- dates ----------
export const pad = (n: number) => String(n).padStart(2, '0')

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): string {
  return isoOf(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return isoOf(d)
}

export function weekdayOf(iso: string): number {
  return new Date(iso + 'T00:00:00').getDay()
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function nowISODateTime(): string {
  const d = new Date()
  return `${isoOf(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 'YYYY-MM-DD' → 'YYYY/MM/DD' (locale-neutral, common in Syria) */
export function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return iso.slice(0, 10).replaceAll('-', '/')
}

export function fmtDateTime(iso?: string): string {
  if (!iso) return '—'
  return iso.replace('T', ' ').slice(0, 16).replaceAll('-', '/')
}

export function monthLabel(ym: string, lang: Lang): string {
  const ar = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول']
  const en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const [y, m] = ym.split('-').map(Number)
  return lang === 'ar' ? `${ar[m - 1]} ${y}` : `${en[m - 1]} ${y}`
}

// ---------- money ----------
const numFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function fmtNum(n: number): string {
  return numFmt.format(Math.round(n))
}

export function fmtSYP(n: number, lang: Lang = 'ar'): string {
  return `${fmtNum(n)} ${lang === 'ar' ? 'ل.س' : 'SYP'}`
}

export function fmtMoney(amount: number, currency: 'SYP' | 'USD', lang: Lang = 'ar'): string {
  if (currency === 'USD') return `$${numFmt.format(amount)}`
  return fmtSYP(amount, lang)
}

// ---------- misc ----------
export function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('')
}

export function timeRange(start: string, end: string): string {
  return `${start} – ${end}`
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replaceAll('"', '""')}"` : s
  }
  // BOM so Excel opens UTF-8 Arabic correctly
  const csv = '﻿' + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
