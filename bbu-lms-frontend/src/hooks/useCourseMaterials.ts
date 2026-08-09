import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/axios'

export type MaterialType = 'file' | 'link' | 'video'

export interface CourseMaterial {
  id: number
  courseOfferingId: number
  title: string
  description: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  externalUrl: string | null
  type: MaterialType
  isPublished: boolean
  publishedAt: string | null
  order: number
  isActive: boolean
  uploadedBy: { id: number; name: string } | null
  viewCount: number
  downloadCount: number
  createdAt: string | null
  updatedAt: string | null
}

export interface MaterialsData {
  materials: CourseMaterial[]
}

export interface MaterialFormData {
  title: string
  description?: string
  type: MaterialType
  file?: File
  externalUrl?: string
  isPublished?: boolean
  order?: number
}

export function useCourseMaterials(offeringId: number | undefined) {
  return useQuery<MaterialsData, Error>({
    queryKey: ['course-materials', offeringId],
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/materials`)
      return data.data as MaterialsData
    },
    enabled: !!offeringId,
  })
}

export function useCreateMaterial(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<CourseMaterial, Error, MaterialFormData>({
    mutationFn: async (formData) => {
      const payload = new FormData()
      payload.append('title', formData.title)
      if (formData.description) payload.append('description', formData.description)
      payload.append('type', formData.type)
      if (formData.file) payload.append('file', formData.file)
      if (formData.externalUrl) payload.append('externalUrl', formData.externalUrl)
      payload.append('isPublished', String(formData.isPublished ?? true))
      if (formData.order != null) payload.append('order', String(formData.order))

      const { data } = await api.post(`/course-offerings/${offeringId}/materials`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.data as CourseMaterial
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials', offeringId] })
    },
  })
}

export function useUpdateMaterial(offeringId: number | undefined, materialId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<CourseMaterial, Error, Partial<MaterialFormData>>({
    mutationFn: async (formData) => {
      const { data } = await api.put(`/course-offerings/${offeringId}/materials/${materialId}`, {
        ...formData,
        isPublished: formData.isPublished ?? true,
      })
      return data.data as CourseMaterial
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials', offeringId] })
    },
  })
}

export function useToggleMaterial(offeringId: number | undefined) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, number>({
    mutationFn: async (materialId) => {
      await api.delete(`/course-offerings/${offeringId}/materials/${materialId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-materials', offeringId] })
    },
  })
}

export function useDownloadMaterial() {
  return {
    download: (material: CourseMaterial) => {
      if (material.type === 'file') {
        window.open(`${api.defaults.baseURL}/course-materials/${material.id}/download`, '_blank')
      } else if (material.externalUrl) {
        window.open(material.externalUrl, '_blank')
      }
    },
  }
}

export function useTrackMaterialView() {
  return useMutation<void, Error, number>({
    mutationFn: async (materialId) => {
      await api.post(`/course-materials/${materialId}/track-view`)
    },
  })
}

export interface CourseMaterialTrackingItem {
  id: number
  material: CourseMaterial | null
  student: { id: number; name: string; email: string } | null
  action: 'view' | 'download'
  ipAddress: string | null
  userAgent: string | null
  viewedAt: string
  createdAt: string | null
  updatedAt: string | null
}

export interface TrackingData {
  tracking: CourseMaterialTrackingItem[]
}

export function useCourseMaterialTracking(offeringId: number | undefined, enabled: boolean) {
  return useQuery<TrackingData, Error>({
    queryKey: ['course-material-tracking', offeringId],
    queryFn: async () => {
      const { data } = await api.get(`/course-offerings/${offeringId}/materials/tracking`)
      return data.data as TrackingData
    },
    enabled: !!offeringId && enabled,
  })
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
