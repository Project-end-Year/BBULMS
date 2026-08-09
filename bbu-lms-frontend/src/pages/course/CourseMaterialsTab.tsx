import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  FileText,
  Link2,
  Video,
  Upload,
  ExternalLink,
  Download,
  Pencil,
  Trash2,
  Loader2,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Files,
  PlayCircle,
  FileSearch,
} from 'lucide-react'

import { type CourseOfferingSummary, type CourseDetailSummary } from '@/hooks/useCourseDetail'
import {
  useCourseMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useToggleMaterial,
  useDownloadMaterial,
  useTrackMaterialView,
  useCourseMaterialTracking,
  usePreviewMaterial,
  formatFileSize,
  type CourseMaterial,
  type MaterialFormData,
  type PreviewData,
} from '@/hooks/useCourseMaterials'

interface CourseMaterialsTabProps {
  data: CourseDetailSummary
}

const TYPE_OPTIONS: { value: MaterialFormData['type']; label: string }[] = [
  { value: 'file', label: 'File upload' },
  { value: 'link', label: 'External link' },
  { value: 'video', label: 'Video link' },
]

function getFileIcon(type: CourseMaterial['type']) {
  if (type === 'video') return Video
  if (type === 'link') return Link2
  return FileText
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function MaterialModal({
  isOpen,
  onClose,
  offeringId,
  material,
}: {
  isOpen: boolean
  onClose: () => void
  offeringId: number
  material?: CourseMaterial
}) {
  const isEditing = Boolean(material)
  const [title, setTitle] = useState(material?.title ?? '')
  const [description, setDescription] = useState(material?.description ?? '')
  const [type, setType] = useState<MaterialFormData['type']>(material?.type ?? 'file')
  const [externalUrl, setExternalUrl] = useState(material?.externalUrl ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [isPublished, setIsPublished] = useState(material?.isPublished ?? true)
  const [order, setOrder] = useState<number>(material?.order ?? 0)

  const create = useCreateMaterial(offeringId)
  const update = useUpdateMaterial(offeringId, material?.id)

  if (!isOpen) return null

  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData: MaterialFormData = {
      title,
      description: description || undefined,
      type,
      externalUrl: externalUrl || undefined,
      file: file ?? undefined,
      isPublished,
      order,
    }

    try {
      if (isEditing && material) {
        await update.mutateAsync(formData)
        toast.success('Material updated.')
      } else {
        await create.mutateAsync(formData)
        toast.success('Material uploaded.')
      }
      onClose()
      setTitle('')
      setDescription('')
      setType('file')
      setExternalUrl('')
      setFile(null)
      setIsPublished(true)
      setOrder(0)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save material.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">
            {isEditing ? 'Edit Material' : 'Upload Material'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="e.g. Week 1 Lecture Slides"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-text">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              placeholder="Optional description"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaterialFormData['type'])}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'file' && !isEditing && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text">File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required={!isEditing}
                className="block w-full text-sm text-text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-bbu-blue file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-bbu-blue/90"
              />
              <p className="mt-1 text-xs text-text-muted">Max 20 MB. PDFs, Office docs, images, videos, zip.</p>
            </div>
          )}

          {(type === 'link' || type === 'video' || isEditing) && (
            <div>
              <label className="mb-1 block text-sm font-medium text-text">External URL</label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required={type !== 'file'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
                placeholder="https://..."
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Order</label>
              <input
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-bbu-blue focus:ring-bbu-blue"
                />
                Published
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title}
              className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Upload Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MaterialCard({
  material,
  isManager,
  onEdit,
  onToggle,
  onDownload,
  onPreview,
}: {
  material: CourseMaterial
  isManager: boolean
  onEdit: (material: CourseMaterial) => void
  onToggle: (material: CourseMaterial) => void
  onDownload: (material: CourseMaterial) => void
  onPreview: (material: CourseMaterial) => void
}) {
  const Icon = getFileIcon(material.type)
  const isFile = material.type === 'file'
  const isLink = material.type === 'link' || material.type === 'video'

  const handlePrimaryAction = () => {
    if (isFile) {
      onPreview(material)
    } else if (isLink && material.externalUrl) {
      onPreview(material)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bbu-blue/10 text-bbu-blue">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold text-text">{material.title}</h4>
          {material.description && (
            <p className="mt-0.5 text-sm text-text-muted line-clamp-2">{material.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            {material.fileSize != null && <span>{formatFileSize(material.fileSize)}</span>}
            <span>{material.type === 'file' ? material.fileName || 'File' : 'External link'}</span>
            {material.uploadedBy && <span>By {material.uploadedBy.name}</span>}
            <span>{formatDate(material.createdAt)}</span>
            {!material.isPublished && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Draft</span>
            )}
          </div>
          {(material.viewCount > 0 || material.downloadCount > 0) && (
            <div className="mt-2 flex gap-3 text-xs text-text-muted">
              {material.viewCount > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {material.viewCount} view{material.viewCount === 1 ? '' : 's'}
                </span>
              )}
              {material.downloadCount > 0 && (
                <span className="flex items-center gap-1">
                  <Download className="h-3.5 w-3.5" />
                  {material.downloadCount} download{material.downloadCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end lg:flex-row lg:items-center">
        <button
          type="button"
          onClick={handlePrimaryAction}
          className="inline-flex items-center gap-1.5 rounded-lg bg-bbu-blue px-3 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
        >
          {isFile ? <FileSearch className="h-4 w-4" /> : material.type === 'video' ? <PlayCircle className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
          {isFile ? 'Preview' : material.type === 'video' ? 'Watch' : 'Open'}
        </button>

        {isFile && (
          <button
            type="button"
            onClick={() => onDownload(material)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        )}

        {isManager && (
          <>
            <button
              type="button"
              onClick={() => onEdit(material)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onToggle(material)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                material.isActive
                  ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                  : 'border border-green-200 bg-white text-green-600 hover:bg-green-50'
              }`}
            >
              <Trash2 className="h-4 w-4" />
              {material.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function PreviewModal({
  preview,
  material,
  onClose,
}: {
  preview: PreviewData | null
  material: CourseMaterial | null
  onClose: () => void
}) {
  if (!preview || !material) return null

  const isPdf = material.mimeType === 'application/pdf'
  const isImage = material.mimeType?.startsWith('image/')
  const isVideoFile = material.mimeType?.startsWith('video/')
  const isVideoLink = preview.type === 'video'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h3 className="font-semibold text-text">{material.title}</h3>
            <p className="text-xs text-text-muted">
              {material.fileName || material.externalUrl || 'Material preview'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {preview.url && (
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-text hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-text-muted hover:bg-gray-100"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isPdf ? (
            preview.url ? (
              <iframe
                src={preview.url}
                title={material.title}
                className="h-full w-full rounded-lg border border-gray-200 bg-white"
              />
            ) : (
              <p className="text-center text-text-muted">No preview URL available.</p>
            )
          ) : isImage ? (
            preview.url ? (
              <img
                src={preview.url}
                alt={material.title}
                className="mx-auto max-h-full rounded-lg border border-gray-200 shadow-sm"
              />
            ) : null
          ) : isVideoFile ? (
            preview.url ? (
              <video controls className="mx-auto max-h-full rounded-lg border border-gray-200 shadow-sm">
                <source src={preview.url} type={material.mimeType || undefined} />
                Your browser does not support the video tag.
              </video>
            ) : null
          ) : isVideoLink ? (
            preview.url ? (
              <div className="mx-auto aspect-video w-full max-w-3xl rounded-lg border border-gray-200 bg-black">
                <iframe
                  src={getEmbedUrl(preview.url) || preview.url}
                  title={material.title}
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null
          ) : preview.type === 'link' ? (
            <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <ExternalLink className="mx-auto mb-3 h-10 w-10 text-bbu-blue" />
              <h3 className="text-lg font-semibold text-text">External Link</h3>
              <p className="mt-2 break-all text-sm text-text-muted">{preview.url}</p>
              {preview.url && (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
                >
                  Visit link
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          ) : (
            <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" />
              <h3 className="text-lg font-medium text-text">No inline preview</h3>
              <p className="mt-1 text-sm text-text-muted">This file type cannot be previewed inline. Download it instead.</p>
              {preview.url && (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
                >
                  <Download className="h-4 w-4" />
                  Open file
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.hostname.includes('youtu.be')
        ? parsed.pathname.slice(1)
        : parsed.searchParams.get('v')
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)/)
      if (match) return `https://player.vimeo.com/video/${match[1]}`
    }
  } catch {
    // ignore invalid URLs
  }
  return null
}

function CourseMaterialsTab({ data }: CourseMaterialsTabProps) {
  const { offerings, context } = data

  const isManager = context.role === 'admin' || context.role === 'lecturer'

  const [selectedOffering, setSelectedOffering] = useState<CourseOfferingSummary | undefined>(
    offerings.find((o) => o.id === context.offeringId) ?? offerings[0]
  )

  const offeringId = selectedOffering?.id

  const { data: materialsData, isLoading: isLoadingMaterials } = useCourseMaterials(offeringId)
  const { data: trackingData, isLoading: isLoadingTracking } = useCourseMaterialTracking(
    offeringId,
    isManager
  )

  const toggle = useToggleMaterial(offeringId)
  const { download } = useDownloadMaterial()
  const trackView = useTrackMaterialView()
  const previewMutation = usePreviewMaterial()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | undefined>(undefined)
  const [previewMaterial, setPreviewMaterial] = useState<CourseMaterial | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [showTracking, setShowTracking] = useState(false)

  const materials = materialsData?.materials ?? []

  const handleEdit = (material: CourseMaterial) => {
    setEditingMaterial(material)
    setIsModalOpen(true)
  }

  const handleOpenUpload = () => {
    setEditingMaterial(undefined)
    setIsModalOpen(true)
  }

  const handleToggle = async (material: CourseMaterial) => {
    if (!window.confirm(`${material.isActive ? 'Deactivate' : 'Activate'} "${material.title}"?`)) return

    try {
      await toggle.mutateAsync(material.id)
      toast.success(`Material ${material.isActive ? 'deactivated' : 'activated'}.`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update material.')
    }
  }

  const handleDownload = (material: CourseMaterial) => {
    trackView.mutate(material.id)
    download(material)
  }

  const handlePreview = async (material: CourseMaterial) => {
    try {
      const data = await previewMutation.mutateAsync(material)
      setPreviewMaterial(material)
      setPreviewData(data)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load preview.')
    }
  }

  const handleClosePreview = () => {
    setPreviewMaterial(null)
    setPreviewData(null)
  }

  const tracking = trackingData?.tracking ?? []

  const activeMaterials = useMemo(
    () => materials.filter((m) => m.isActive).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
    [materials]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Files className="h-5 w-5 text-bbu-blue" />
          <h2 className="text-lg font-semibold text-text">Course Materials</h2>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={handleOpenUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-bbu-blue px-4 py-2 text-sm font-medium text-white hover:bg-bbu-blue/90"
          >
            <Upload className="h-4 w-4" />
            Upload Material
          </button>
        )}
      </div>

      {offerings.length > 1 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-text">Section / Offering</label>
          <select
            value={selectedOffering?.id ?? ''}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const id = Number(e.target.value)
              setSelectedOffering(offerings.find((o) => o.id === id))
            }}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-bbu-blue focus:outline-none focus:ring-2 focus:ring-bbu-blue/20"
          >
            {offerings.map((offering) => (
              <option key={offering.id} value={offering.id}>
                {offering.semester?.name || 'Unknown semester'}
                {offering.section ? ` · Section ${offering.section}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoadingMaterials ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-text-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : activeMaterials.length > 0 ? (
        <div className="space-y-3">
          {activeMaterials.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              isManager={isManager}
              onEdit={handleEdit}
              onToggle={handleToggle}
              onDownload={handleDownload}
              onPreview={handlePreview}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-text-muted" />
          <h3 className="text-lg font-medium text-text">No Materials Yet</h3>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            {isManager
              ? 'Upload lecture notes, slides, links, or videos for this course.'
              : 'Materials for this course will appear here once published.'}
          </p>
        </div>
      )}

      {isManager && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowTracking((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-bbu-blue" />
              <h3 className="text-lg font-semibold text-text">View / Download Tracking</h3>
            </div>
            {showTracking ? <ChevronUp className="h-5 w-5 text-text-muted" /> : <ChevronDown className="h-5 w-5 text-text-muted" />}
          </button>

          {showTracking && (
            <div className="border-t border-gray-200 p-4">
              {isLoadingTracking ? (
                <div className="flex items-center justify-center p-8 text-text-muted">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tracking.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 font-medium text-text">Student</th>
                        <th className="px-4 py-3 font-medium text-text">Material</th>
                        <th className="px-4 py-3 font-medium text-text">Action</th>
                        <th className="px-4 py-3 font-medium text-text">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tracking.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-text">{item.student?.name || 'Unknown'}</p>
                              <p className="text-xs text-text-muted">{item.student?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{item.material?.title || 'Unknown'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.action === 'download'
                                  ? 'bg-bbu-blue/10 text-bbu-blue'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {item.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-text-muted">{formatDate(item.viewedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">No views or downloads recorded yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offeringId={offeringId ?? 0}
        material={editingMaterial}
      />

      <PreviewModal preview={previewData} material={previewMaterial} onClose={handleClosePreview} />
    </div>
  )
}

export default CourseMaterialsTab
