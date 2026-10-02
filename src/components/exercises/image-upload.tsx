'use client'

import * as React from 'react'
import { Upload, Trash2, Loader2, ImageIcon, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { ExerciseImage } from '@/lib/types/exercise'

interface ImageUploadProps {
  images: ExerciseImage[]
  onImagesChange: (images: ExerciseImage[]) => void
}

const MAX_SIZE = 5 * 1024 * 1024
const MAX_IMAGES = 3
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImageUpload({ images: rawImages, onImagesChange }: ImageUploadProps) {
  const images = rawImages.filter((img) => img.path)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [blobPreviews, setBlobPreviews] = React.useState<Record<string, string>>({})
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

    if (images.length >= MAX_IMAGES) {
      setError(`Maximal ${MAX_IMAGES} Bilder erlaubt.`)
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Nur JPG, PNG oder WebP erlaubt.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Maximale Dateigröße: 5 MB.')
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Nicht angemeldet.')
        return
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`

      const blobUrl = URL.createObjectURL(file)
      setBlobPreviews((prev) => ({ ...prev, [path]: blobUrl }))

      const { error: uploadError } = await supabase.storage
        .from('exercise-images')
        .upload(path, file, { upsert: false })

      if (uploadError) {
        setError('Bild konnte nicht hochgeladen werden.')
        setBlobPreviews((prev) => {
          const next = { ...prev }
          delete next[path]
          return next
        })
        return
      }

      const isCover = images.length === 0
      onImagesChange([...images, { path, isCover }])
    } catch {
      setError('Bild konnte nicht hochgeladen werden.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove(index: number) {
    const img = images[index]

    try {
      const supabase = createClient()
      await supabase.storage.from('exercise-images').remove([img.path])
    } catch {
      // ignore removal errors
    }

    setBlobPreviews((prev) => {
      const next = { ...prev }
      delete next[img.path]
      return next
    })

    const updated = images.filter((_, i) => i !== index)
    if (img.isCover && updated.length > 0) {
      updated[0] = { ...updated[0], isCover: true }
    }
    onImagesChange(updated)
  }

  function handleSetCover(index: number) {
    const updated = images.map((img, i) => ({
      ...img,
      isCover: i === index,
    }))
    onImagesChange(updated)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Du kannst bis zu 3 Bilder hochladen. Wähle eines als Titelbild — es wird in der Kartenansicht angezeigt.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={img.path} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent data-[cover=true]:border-primary transition-colors"
                data-cover={img.isCover}
              >
                {blobPreviews[img.path] ? (
                  <img
                    src={blobPreviews[img.path]}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <SignedImage storagePath={img.path} />
                )}
              </div>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemove(i)}
                  disabled={uploading}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <button
                type="button"
                onClick={() => handleSetCover(i)}
                className={`absolute bottom-1 left-1 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md transition-colors ${
                  img.isCover
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background/80 text-muted-foreground hover:bg-background hover:text-foreground'
                }`}
              >
                <Star className={`h-3 w-3 ${img.isCover ? 'fill-current' : ''}`} />
                {img.isCover ? 'Titelbild' : 'Als Titelbild'}
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin mb-1" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
          )}
          <span className="text-sm text-muted-foreground">
            {uploading ? 'Wird hochgeladen...' : `Bild hochladen (${images.length}/${MAX_IMAGES})`}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG oder WebP · max. 5 MB
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

function SignedImage({ storagePath }: { storagePath: string }) {
  const [src, setSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (storagePath.startsWith('http')) {
      setSrc(storagePath)
      return
    }
    const supabase = createClient()
    supabase.storage
      .from('exercise-images')
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data }) => {
        if (data?.signedUrl) setSrc(data.signedUrl)
      })
  }, [storagePath])

  if (!src) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-contain"
    />
  )
}
