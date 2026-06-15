'use client'

import { Scale, MapPin, Phone } from 'lucide-react'
import { LawyerCardData } from '@/lib/api'

interface LawyerCardProps {
  data: LawyerCardData
}

const DLSA_CONTACTS: Record<string, { address: string; phone: string; url: string }> = {
  Nashik:     { address: 'जिल्हा न्यायालय, नाशिक',      phone: '0253-2317100', url: 'https://msla.nic.in' },
  Pune:       { address: 'जिल्हा न्यायालय, पुणे',        phone: '020-26127700', url: 'https://msla.nic.in' },
  Aurangabad: { address: 'जिल्हा न्यायालय, औरंगाबाद',   phone: '0240-2334455', url: 'https://msla.nic.in' },
  Nagpur:     { address: 'जिल्हा न्यायालय, नागपूर',      phone: '0712-2563200', url: 'https://msla.nic.in' },
  Amravati:   { address: 'जिल्हा न्यायालय, अमरावती',    phone: '0721-2662100', url: 'https://msla.nic.in' },
  default:    { address: 'महाराष्ट्र राज्य कायदेशीर सेवा प्राधिकरण', phone: '022-22621393', url: 'https://msla.nic.in' },
}

export default function LawyerCard({ data }: LawyerCardProps) {
  const dlsa = DLSA_CONTACTS[data.dlsa_district ?? 'default'] ?? DLSA_CONTACTS['default']
  const isUrgent = data.risk_score >= 4
  const isSafe = data.risk_score <= 1

  return (
    <div className={`rounded-2xl border p-5 ${
      isUrgent ? 'bg-red-50 border-red-200' : isSafe ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${isUrgent ? 'bg-red-100' : isSafe ? 'bg-green-100' : 'bg-amber-100'}`}>
          <Scale size={20} className={isUrgent ? 'text-red-600' : isSafe ? 'text-green-600' : 'text-amber-600'} />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">वकील सल्ला कार्ड</p>
          <p className={`text-base font-bold ${isUrgent ? 'text-red-700' : isSafe ? 'text-green-700' : 'text-amber-700'}`}>
            {data.recommendation}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed mb-4">{data.reason}</p>
      <div className="bg-white/70 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">मोफत कायदेशीर मदत</p>
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-700">{dlsa.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-indigo-500 flex-shrink-0" />
          <a href={`tel:${dlsa.phone}`} className="text-sm text-indigo-600 font-medium hover:underline">{dlsa.phone}</a>
        </div>
        <a href={dlsa.url} target="_blank" rel="noopener noreferrer"
          className="block text-center text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg transition mt-2">
          DLSA वेबसाईट उघडा →
        </a>
      </div>
    </div>
  )
}