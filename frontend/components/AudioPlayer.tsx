'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Loader } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoaded = () => setIsLoading(false)
    const onDuration = () => setDuration(audio.duration)
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onEnded = () => { setIsPlaying(false); setProgress(0) }
    audio.addEventListener('canplaythrough', onLoaded)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('canplaythrough', onLoaded)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) { audio.pause() } else { audio.play() }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (s: number) => {
    if (isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = (Number(e.target.value) / 100) * duration
    audio.currentTime = newTime
    setProgress(Number(e.target.value))
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={18} className="text-indigo-500" />
        <div>
          <p className="text-sm font-semibold text-indigo-700">मराठीत ऐका</p>
          <p className="text-xs text-indigo-400">दस्तऐवजाचे विश्लेषण मराठीत</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition disabled:opacity-50 flex-shrink-0"
        >
          {isLoading ? <Loader size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="flex-1">
          <input
            type="range" min={0} max={100} value={progress}
            onChange={handleSeek}
            className="w-full h-1.5 appearance-none rounded-full bg-indigo-200 accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-indigo-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      <audio ref={audioRef} src={audioUrl} preload="auto" />
    </div>
  )
}