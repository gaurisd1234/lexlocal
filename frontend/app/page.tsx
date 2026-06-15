'use client'

import { useState } from 'react'
import { Scale, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import UploadZone from '@/components/UploadZone'
import ClauseCard from '@/components/ClauseCard'
import RiskGauge from '@/components/RiskGauge'
import AudioPlayer from '@/components/AudioPlayer'
import LawyerCard from '@/components/LawyerCard'
import { analyzeDocument, AnalyzeResponse } from '@/lib/api'

type PageState = 'upload' | 'loading' | 'results' | 'error'

const DOC_TYPE_LABELS: Record<string, string> = {
  sale_deed: 'विक्री करार / खरेदी खत',
  loan_agreement: 'कर्ज करार',
  insurance: 'विमा पॉलिसी',
  lease: 'भाडे करार',
  power_of_attorney: 'मुखत्यारपत्र',
  unknown: 'अज्ञात दस्तऐवज',
}

const LOADING_MESSAGES = [
  'दस्तऐवज वाचत आहे...',
  'कलमे ओळखत आहे...',
  'मराठीत भाषांतर करत आहे...',
  'जोखीम तपासत आहे...',
  'ऑडिओ तयार करत आहे...',
]

export default function HomePage() {
  const [state, setState] = useState<PageState>('upload')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [error, setError] = useState('')
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])

  const handleFileSelect = async (file: File) => {
    setState('loading')
    setError('')
    let msgIndex = 0
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIndex])
    }, 3000)

    try {
      const data = await analyzeDocument(file)
      setResult(data)
      setState('results')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      const message = axiosErr?.response?.data?.detail || 'विश्लेषण अयशस्वी झाले. पुन्हा प्रयत्न करा.'
      setError(message)
      setState('error')
    } finally {
      clearInterval(interval)
    }
  }

  const reset = () => {
    setState('upload')
    setResult(null)
    setError('')
    setLoadingMsg(LOADING_MESSAGES[0])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Scale size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">LexLocal</h1>
          <p className="text-indigo-600 font-medium mt-1">AI ग्रामीण कायदेशीर सहाय्यक</p>
          <p className="text-sm text-gray-500 mt-1">आपल्या हक्कांची भाषा</p>
        </div>

        {/* UPLOAD */}
        {state === 'upload' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">दस्तऐवज अपलोड करा</h2>
            <p className="text-sm text-gray-500 mb-6">कर्ज करार, जमीन खरेदी, विमा पॉलिसी किंवा इतर कायदेशीर कागद अपलोड करा</p>
            <UploadZone onFileSelect={handleFileSelect} isLoading={false} />
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { emoji: '📄', label: 'खरेदी खत' },
                { emoji: '🏦', label: 'कर्ज करार' },
                { emoji: '🌾', label: 'पीक विमा' },
                { emoji: '🏘️', label: 'भाडे करार' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                  <span>{item.emoji}</span><span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOADING */}
        {state === 'loading' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
            <Loader2 size={48} className="text-indigo-500 animate-spin mx-auto mb-6" />
            <p className="text-lg font-semibold text-gray-800 mb-2">{loadingMsg}</p>
            <p className="text-sm text-gray-500">यास 20-40 सेकंद लागू शकतात. कृपया थांबा.</p>
            <div className="mt-6 flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="bg-white rounded-3xl shadow-sm border border-red-100 p-8 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800 mb-2">चूक झाली</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button onClick={reset} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition">
              <RotateCcw size={16} />पुन्हा प्रयत्न करा
            </button>
          </div>
        )}

        {/* RESULTS */}
        {state === 'results' && result && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">दस्तऐवज प्रकार</p>
                <p className="text-base font-semibold text-gray-800">
                  {DOC_TYPE_LABELS[result.document_type] || result.document_type}
                </p>
              </div>
              <button onClick={reset} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                <RotateCcw size={14} />नवीन दस्तऐवज
              </button>
            </div>

            <RiskGauge score={result.lawyer_card.risk_score} overall={result.overall_risk} />

            {result.audio_url && (
              <AudioPlayer audioUrl={`${process.env.NEXT_PUBLIC_API_URL}${result.audio_url}`} />
            )}

            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                कलम विश्लेषण ({result.clauses.length} कलमे)
              </p>
              <div className="space-y-3">
                {result.clauses.map((clause, i) => (
                  <ClauseCard key={i} clause={clause} index={i} />
                ))}
              </div>
            </div>

            <LawyerCard data={result.lawyer_card} />

            {result.schemes.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  🌾 तुम्हाला मिळू शकणाऱ्या सरकारी योजना
                </p>
                <div className="space-y-3">
                  {result.schemes.map((scheme, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{scheme.scheme_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{scheme.reason}</p>
                      </div>
                      <a href={scheme.apply_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-indigo-600 font-semibold whitespace-nowrap hover:underline">
                        अर्ज करा →
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}