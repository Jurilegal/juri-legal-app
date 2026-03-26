'use client'
import { useState, useRef, type DragEvent } from 'react'

interface Props {
  onFilesSelected: (files: File[]) => void
  accept?: string
  multiple?: boolean
  uploading?: boolean
  label?: string
}

export function DragDropUpload({ onFilesSelected, accept, multiple = true, uploading = false, label = 'Dateien hier ablegen oder klicken' }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrag(e: DragEvent) { e.preventDefault(); e.stopPropagation() }
  function handleDragIn(e: DragEvent) { handleDrag(e); setDragOver(true) }
  function handleDragOut(e: DragEvent) { handleDrag(e); setDragOver(false) }
  function handleDrop(e: DragEvent) {
    handleDrag(e); setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFilesSelected(multiple ? files : [files[0]])
  }

  return (
    <div
      onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
        dragOver ? 'border-gold-400 bg-gold-50' : 'border-navy-200 hover:border-navy-300 hover:bg-navy-50'
      } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input ref={inputRef} type="file" className="hidden" accept={accept} multiple={multiple}
        onChange={e => { if (e.target.files?.length) onFilesSelected(Array.from(e.target.files)); e.target.value = '' }} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-navy-200 border-t-gold-400 rounded-full animate-spin" />
          <p className="text-sm text-navy-500">Wird hochgeladen...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl">📤</span>
          <p className="text-sm text-navy-500">{label}</p>
          <p className="text-xs text-navy-300">oder per Drag & Drop ablegen</p>
        </div>
      )}
    </div>
  )
}
