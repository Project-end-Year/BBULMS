import { useRef, useState } from 'react'
import { Loader2, Upload, User } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/lib/axios'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/hooks/useAuth'

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export function AvatarUpload() {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const avatarUrl = user?.avatarUrl || null

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.match(/image\/(jpeg|png|webp)/)) {
      toast.error('Please select a JPEG, PNG, or WebP image.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Image must be smaller than 2 MB.')
      return
    }

    const formData = new FormData()
    formData.append('avatar', file)

    setIsUploading(true)

    try {
      const { data } = await api.post('/profile/avatar', formData)
      const updatedUser = data?.data

      if (updatedUser) {
        queryClient.setQueryData(['user'], updatedUser)
        toast.success('Profile photo updated')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload profile photo')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-bbu-blue/20 disabled:cursor-not-allowed"
        aria-label="Upload profile photo"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full object-cover transition-opacity group-hover:opacity-75"
          />
        ) : (
          <User className="h-10 w-10 text-text-muted" />
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Upload className="h-6 w-6 text-white" />
          )}
        </div>
      </button>

      <div className="flex flex-col">
        <p className="text-sm font-medium text-text">Profile photo</p>
        <p className="text-xs text-text-muted">
          JPG, PNG, or WebP · max 2 MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
