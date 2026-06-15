'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, FileText, X } from 'lucide-react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading: boolean
}

export default function UploadZone({ onFileSelect, isLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowed.includes(file.type)) {
      alert('फक्त JPG, PNG किंवा PDF फाईल अपलोड करा')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('फाईलचा आकार 10MB पेक्षा कमी असावा')
      return
    }
    setFileName(file.name)
    if (file.type !== 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const clearFile = () => {
    setPreview(null)
    setFileName(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg object-contain shadow" />
            <button onClick={clearFile} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
              <X size={14} />
            </button>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="text-indigo-500" size={40} />
            <div className="text-left">
              <p className="font-medium text-gray-800">{fileName}</p>
              <p className="text-sm text-gray-500">PDF दस्तऐवज</p>
            </div>
            <button onClick={clearFile} className="ml-4 text-red-400 hover:text-red-600"><X size={18} /></button>
          </div>
        ) : (
          <>
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-lg font-medium text-gray-700 mb-1">दस्तऐवज इथे टाका</p>
            <p className="text-sm text-gray-500 mb-1">किंवा खालील बटण वापरा</p>
            <p className="text-xs text-gray-400">JPG, PNG, PDF • जास्तीत जास्त 10MB</p>
          </>
        )}
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Upload size={18} />फाईल निवडा
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
        >
          <Camera size={18} />फोटो काढा
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileInput} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileInput} className="hidden" />
    </div>
  )
}