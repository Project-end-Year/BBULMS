<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\CourseMaterialResource;
use App\Http\Resources\CourseMaterialViewResource;
use App\Models\CourseMaterial;
use App\Models\CourseMaterialView;
use App\Models\CourseOffering;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseMaterialController extends Controller
{
    /**
     * Allowed MIME types for file uploads.
     */
    private const ALLOWED_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'image/jpeg',
        'image/png',
        'image/webp',
        'video/mp4',
        'text/plain',
    ];

    /**
     * Maximum file size in kilobytes.
     */
    private const MAX_FILE_SIZE_KB = 20480; // 20 MB

    /**
     * List materials for an offering.
     */
    public function index(CourseOffering $offering)
    {
        Gate::authorize('view', $offering->course);

        $user = Auth::user();
        $isManager = $user instanceof User && ($user->hasRole('admin') || ($user->hasRole('lecturer') && $offering->lecturer_id === $user->id));

        $query = $offering->materials()
            ->with(['uploader'])
            ->withCount([
                'views as views_count' => function ($q) {
                    $q->where('action', 'view');
                },
                'views as downloads_count' => function ($q) {
                    $q->where('action', 'download');
                },
            ])
            ->where('is_active', true);

        if (! $isManager) {
            $query->where('is_published', true);
        }

        $materials = $query
            ->orderBy('order')
            ->orderBy('created_at', 'desc')
            ->get();

        return ApiResponse::success([
            'materials' => CourseMaterialResource::collection($materials),
        ]);
    }

    /**
     * Store a new material (file upload or external link).
     */
    public function store(Request $request, CourseOffering $offering)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering)) {
            abort(403, 'Only administrators or the assigned lecturer can upload materials.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', Rule::in(['file', 'link', 'video'])],
            'externalUrl' => ['nullable', 'url', 'max:500', 'required_if:type,link,video'],
            'file' => [
                'nullable',
                'file',
                'mimetypes:' . implode(',', self::ALLOWED_MIMES),
                'max:' . self::MAX_FILE_SIZE_KB,
                'required_if:type,file',
            ],
            'isPublished' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $type = $validated['type'];

        if ($type === 'file') {
            if (! $request->hasFile('file')) {
                throw ValidationException::withMessages([
                    'file' => ['A file is required when type is file.'],
                ]);
            }

            $uploadedFile = $request->file('file');
            $path = $this->storeFile($offering, $uploadedFile);

            $material = $offering->materials()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'file_path' => $path,
                'file_name' => $uploadedFile->getClientOriginalName(),
                'file_size' => $uploadedFile->getSize(),
                'mime_type' => $uploadedFile->getMimeType(),
                'external_url' => null,
                'type' => 'file',
                'uploaded_by' => $user->id,
                'is_published' => $validated['isPublished'] ?? true,
                'published_at' => ($validated['isPublished'] ?? true) ? now() : null,
                'order' => $validated['order'] ?? 0,
            ]);
        } else {
            if (empty($validated['externalUrl'])) {
                throw ValidationException::withMessages([
                    'externalUrl' => ['An external URL is required for this material type.'],
                ]);
            }

            $material = $offering->materials()->create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'file_path' => null,
                'file_name' => null,
                'file_size' => null,
                'mime_type' => null,
                'external_url' => $validated['externalUrl'],
                'type' => $type,
                'uploaded_by' => $user->id,
                'is_published' => $validated['isPublished'] ?? true,
                'published_at' => ($validated['isPublished'] ?? true) ? now() : null,
                'order' => $validated['order'] ?? 0,
            ]);
        }

        return ApiResponse::success(
            new CourseMaterialResource($material->load('uploader')),
            'Material created successfully.',
            201
        );
    }

    /**
     * Update a material.
     */
    public function update(Request $request, CourseOffering $offering, CourseMaterial $material)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering)) {
            abort(403, 'Only administrators or the assigned lecturer can update materials.');
        }

        if ($material->course_offering_id !== $offering->id) {
            abort(404, 'Material not found for this offering.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'externalUrl' => ['nullable', 'url', 'max:500'],
            'isPublished' => ['nullable', 'boolean'],
            'order' => ['nullable', 'integer', 'min:0'],
        ]);

        $wasPublished = $material->is_published;
        $isPublished = $validated['isPublished'] ?? $wasPublished;

        $update = [
            'title' => $validated['title'],
            'description' => $validated['description'] ?? $material->description,
            'is_published' => $isPublished,
            'published_at' => $isPublished && ! $wasPublished ? now() : $material->published_at,
            'order' => $validated['order'] ?? $material->order,
        ];

        if ($material->type !== 'file' && ! empty($validated['externalUrl'])) {
            $update['external_url'] = $validated['externalUrl'];
        }

        $material->update($update);

        return ApiResponse::success(
            new CourseMaterialResource($material->load('uploader')),
            'Material updated successfully.'
        );
    }

    /**
     * Toggle a material's active status.
     */
    public function destroy(CourseOffering $offering, CourseMaterial $material)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering)) {
            abort(403, 'Only administrators or the assigned lecturer can remove materials.');
        }

        if ($material->course_offering_id !== $offering->id) {
            abort(404, 'Material not found for this offering.');
        }

        $material->update(['is_active' => ! $material->is_active]);

        $status = $material->is_active ? 'activated' : 'deactivated';

        return ApiResponse::success(
            new CourseMaterialResource($material->load('uploader')),
            "Material {$status} successfully."
        );
    }

    /**
     * Download a material file.
     */
    public function download(CourseMaterial $material)
    {
        Gate::authorize('view', $material->courseOffering->course);

        if ($material->type === 'file') {
            if (! $material->file_path || ! Storage::disk('public')->exists($material->file_path)) {
                abort(404, 'File not found.');
            }

            $this->trackAction($material, 'download');

            return Storage::disk('public')->download($material->file_path, $material->file_name);
        }

        $this->trackAction($material, 'view');

        return redirect()->away($material->external_url);
    }

    /**
     * Preview a material file inline (browser-rendered).
     */
    public function preview(CourseMaterial $material)
    {
        Gate::authorize('view', $material->courseOffering->course);

        if ($material->type !== 'file') {
            $this->trackAction($material, 'view');

            return ApiResponse::success([
                'type' => $material->type,
                'url' => $material->external_url,
            ]);
        }

        if (! $material->file_path || ! Storage::disk('public')->exists($material->file_path)) {
            abort(404, 'File not found.');
        }

        $this->trackAction($material, 'view');

        $mime = $material->mime_type ?: Storage::disk('public')->mimeType($material->file_path);

        return Storage::disk('public')->response(
            $material->file_path,
            $material->file_name,
            [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $material->file_name . '"',
            ]
        );
    }

    /**
     * Track a view action.
     */
    public function trackView(CourseMaterial $material)
    {
        Gate::authorize('view', $material->courseOffering->course);

        $this->trackAction($material, 'view');

        return ApiResponse::success(null, 'View recorded.');
    }

    /**
     * Return per-student tracking summary for an offering.
     */
    public function tracking(CourseOffering $offering)
    {
        $user = $this->requireUser();

        if (! $this->canManageOffering($user, $offering)) {
            abort(403, 'Only administrators or the assigned lecturer can view tracking.');
        }

        $summary = CourseMaterialView::whereHas('material', function ($q) use ($offering) {
            $q->where('course_offering_id', $offering->id);
        })
            ->with(['student', 'material'])
            ->orderBy('viewed_at', 'desc')
            ->get();

        return ApiResponse::success([
            'tracking' => CourseMaterialViewResource::collection($summary),
        ]);
    }

    /**
     * Store an uploaded file and return its path.
     */
    private function storeFile(CourseOffering $offering, $file): string
    {
        $courseId = $offering->course_id;
        $offeringId = $offering->id;
        $extension = $file->getClientOriginalExtension();
        $filename = uniqid() . ($extension ? '.' . $extension : '');

        $path = "course_materials/{$courseId}/{$offeringId}/{$filename}";
        $file->storeAs(dirname($path), basename($path), 'public');

        return $path;
    }

    /**
     * Record a view or download action.
     */
    private function trackAction(CourseMaterial $material, string $action): void
    {
        $user = Auth::user();

        if (! $user instanceof User || ! $user->hasRole('student')) {
            return;
        }

        CourseMaterialView::updateOrCreate(
            [
                'course_material_id' => $material->id,
                'student_id' => $user->id,
                'action' => $action,
            ],
            [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'viewed_at' => now(),
            ]
        );
    }

    /**
     * Determine whether the user can manage an offering's materials.
     */
    private function canManageOffering(User $user, CourseOffering $offering): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->hasRole('lecturer') && $offering->lecturer_id === $user->id;
    }

    /**
     * Require an authenticated user.
     */
    private function requireUser(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        return $user;
    }
}
