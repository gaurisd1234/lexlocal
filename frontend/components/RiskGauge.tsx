'use client'

interface RiskGaugeProps {
  score: number
  overall: 'RED' | 'YELLOW' | 'GREEN'
}

const SCORE_CONFIG: Record<number, { color: string; bg: string; marathi: string }> = {
  1: { color: 'text-green-600',  bg: 'bg-green-500',  marathi: 'अत्यंत सुरक्षित' },
  2: { color: 'text-green-500',  bg: 'bg-green-400',  marathi: 'सुरक्षित' },
  3: { color: 'text-yellow-600', bg: 'bg-yellow-500', marathi: 'सावधगिरी आवश्यक' },
  4: { color: 'text-orange-600', bg: 'bg-orange-500', marathi: 'जोखमीचे' },
  5: { color: 'text-red-600',    bg: 'bg-red-500',    marathi: 'धोकादायक' },
}

export default function RiskGauge({ score, overall }: RiskGaugeProps) {
  const config = SCORE_CONFIG[score] || SCORE_CONFIG[3]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">एकूण जोखीम स्तर</p>
      <div className="flex items-end gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-sm transition-all duration-500 ${level <= score ? config.bg : 'bg-gray-100'}`}
            style={{ height: `${level * 10 + 16}px` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-2xl font-bold ${config.color}`}>{score}/5</p>
          <p className={`text-sm font-medium ${config.color}`}>{config.marathi}</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
          overall === 'RED' ? 'bg-red-100 text-red-700' :
          overall === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {overall === 'RED' ? '🔴 धोकादायक' : overall === 'YELLOW' ? '🟡 सावधान' : '🟢 सुरक्षित'}
        </div>
      </div>
    </div>
  )
}