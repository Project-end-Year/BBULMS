<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\GradeComponentResource;
use App\Models\CourseOffering;
use App\Models\GradeComponent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class GradeComponentController extends Controller
{
    public function index(CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('viewAny', [GradeComponent::class, $offering]);

        $components = GradeComponent::query()
            ->where('course_offering_id', $offering->id)
            ->orderBy('order')
            ->get();

        return ApiResponse::success([
            'components' => GradeComponentResource::collection($components),
        ]);
    }

    public function store(Request $request, CourseOffering $offering)
    {
        $this->requireUser();
        Gate::authorize('create', [GradeComponent::class, $offering]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:assignment,attendance,quiz,midterm,final,custom'],
            'weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'order' => ['nullable', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ]);

        $totalWeight = GradeComponent::query()
            ->where('course_offering_id', $offering->id)
            ->sum('weight');

        if (($totalWeight + $validated['weight']) > 100) {
            return ApiResponse::error('Total component weight cannot exceed 100%.', 422);
        }

        $component = GradeComponent::create([
            'course_offering_id' => $offering->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'weight' => $validated['weight'],
            'order' => $validated['order'] ?? 0,
            'settings' => $validated['settings'] ?? null,
        ]);

        return ApiResponse::success(
            ['component' => new GradeComponentResource($component)],
            'Grade component created.',
            201
        );
    }

    public function update(Request $request, CourseOffering $offering, GradeComponent $component)
    {
        $this->requireUser();
        Gate::authorize('update', $component);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:assignment,attendance,quiz,midterm,final,custom'],
            'weight' => ['required', 'numeric', 'min:0', 'max:100'],
            'order' => ['nullable', 'integer', 'min:0'],
            'settings' => ['nullable', 'array'],
        ]);

        $totalWeight = GradeComponent::query()
            ->where('course_offering_id', $offering->id)
            ->where('id', '!=', $component->id)
            ->sum('weight');

        if (($totalWeight + $validated['weight']) > 100) {
            return ApiResponse::error('Total component weight cannot exceed 100%.', 422);
        }

        $component->update([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'weight' => $validated['weight'],
            'order' => $validated['order'] ?? $component->order,
            'settings' => $validated['settings'] ?? $component->settings,
        ]);

        return ApiResponse::success(
            ['component' => new GradeComponentResource($component)],
            'Grade component updated.'
        );
    }

    public function destroy(CourseOffering $offering, GradeComponent $component)
    {
        $this->requireUser();
        Gate::authorize('delete', $component);

        $component->delete();

        return ApiResponse::success(['deleted' => true], 'Grade component deleted.');
    }

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
