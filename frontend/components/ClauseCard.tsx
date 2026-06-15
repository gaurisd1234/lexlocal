'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react'
import { Clause } from '@/lib/api'

interface ClauseCardProps {
  clause: Clause
  index: number
}

type RiskKey = 'RED' | 'YELLOW' | 'GREEN'

const RISK_CONFIG: Record<RiskKey, {
  bg: string; border: string; badge: string;
  icon: React.ElementType; iconColor: string; label: string; dot: string
}> = {
  RED: {
    bg: 'bg-red-50', border: 'border-red-200',
    badge: 'bg-red-100 text-red-700 border border-red-200',
    icon: AlertTriangle, iconColor: 'text-red-500', label: 'धोकादायक', dot: 'bg-red-500',
  },
  YELLOW: {
    bg: 'bg-yellow-50', border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    icon: Info, iconColor: 'text-yellow-500', label: 'लक्ष द्या', dot: 'bg-yellow-500',
  },
  GREEN: {
    bg: 'bg-green-50', border: 'border-green-200',
    badge: 'bg-green-100 text-green-700 border border-green-200',
    icon: CheckCircle, iconColor: 'text-green-500', label: 'सुरक्षित', dot: 'bg-green-500',
  },
}

export default function ClauseCard({ clause, index }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(clause.risk_level === 'RED')
  const config = RISK_CONFIG[clause.risk_level as RiskKey] || RISK_CONFIG.YELLOW
  const Icon = config.icon

  return (
    <div className={`rounded-xl border ${config.border} ${config.bg} overflow-hidden transition-all`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:opacity-80 transition"
      >
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className="text-xs font-semibold text-gray-500 flex-shrink-0">कलम {clause.clause_number}</span>
        <Icon size={16} className={`flex-shrink-0 ${config.iconColor}`} />
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
          {config.label}
        </span>
        <span className="text-sm text-gray-600 flex-1 truncate">
          {clause.simple_marathi.slice(0, 60)}...
        </span>
        {expanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px bg-gray-100" />
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">साध्या मराठीत</p>
            <p className="text-sm text-gray-800 leading-relaxed">{clause.simple_marathi}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">का महत्त्वाचे</p>
            <p className="text-sm text-gray-700 leading-relaxed">{clause.risk_reason}</p>
          </div>
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700 font-medium">मूळ कायदेशीर भाषा पाहा</summary>
            <p className="mt-2 p-2 bg-white/60 rounded-lg leading-relaxed text-gray-600 italic">{clause.original_text}</p>
          </details>
          {clause.negotiation_tip && (
            <div className="flex gap-2 p-3 bg-white/70 rounded-lg border border-indigo-100">
              <Lightbulb size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-indigo-600 mb-1">काय मागाल?</p>
                <p className="text-sm text-gray-700 leading-relaxed">{clause.negotiation_tip}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}