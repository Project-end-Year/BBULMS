<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\SemesterResource;
use App\Http\Resources\UserResource;
use App\Models\Department;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\ImageManager;
use Intervention\Image\Encoders\WebpEncoder;

class ProfileController extends Controller
{
    /**
     * Return the authenticated user's profile with related data.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        $user->load([
            'department',
            'roles',
            'studentProfile.department',
            'studentProfile.semester',
            'lecturerProfile.department',
        ]);

        return ApiResponse::success([
            'user' => new UserResource($user),
            'departments' => DepartmentResource::collection(Department::where('is_active', true)->get()),
            'semesters' => SemesterResource::collection(Semester::where('is_active', true)->get()),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'locale' => ['required', 'string', 'in:en,km'],
        ];

        if ($user->hasRole('student')) {
            $rules['studentId'] = ['required', 'string', 'max:50', 'unique:student_profiles,student_id,' . optional($user->studentProfile)->id];
            $rules['departmentId'] = ['nullable', 'exists:departments,id'];
            $rules['major'] = ['nullable', 'string', 'max:255'];
            $rules['year'] = ['nullable', 'integer', 'min:1', 'max:6'];
            $rules['semesterId'] = ['nullable', 'exists:semesters,id'];
        }

        if ($user->hasRole('lecturer')) {
            $rules['departmentId'] = ['nullable', 'exists:departments,id'];
            $rules['title'] = ['nullable', 'string', 'max:255'];
            $rules['officeHours'] = ['nullable', 'array'];
        }

        $validated = $request->validate($rules);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'locale' => $validated['locale'],
        ]);

        if ($user->hasRole('student')) {
            $user->studentProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'student_id' => $validated['studentId'],
                    'department_id' => $validated['departmentId'] ?? null,
                    'major' => $validated['major'] ?? null,
                    'year' => $validated['year'] ?? null,
                    'semester_id' => $validated['semesterId'] ?? null,
                ]
            );
        }

        if ($user->hasRole('lecturer')) {
            $user->lecturerProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'department_id' => $validated['departmentId'] ?? null,
                    'title' => $validated['title'] ?? null,
                    'office_hours' => $validated['officeHours'] ?? null,
                ]
            );
        }

        $user->load([
            'department',
            'roles',
            'studentProfile.department',
            'studentProfile.semester',
            'lecturerProfile.department',
        ]);

        return ApiResponse::success(
            new UserResource($user),
            'Profile updated successfully.'
        );
    }

    /**
     * Upload and resize the authenticated user's avatar.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        $user = Auth::user();

        if (! $user) {
            throw ValidationException::withMessages([
                'user' => ['No authenticated user.'],
            ]);
        }

        $manager = new ImageManager(\Intervention\Image\Drivers\Gd\Driver::class);
        $image = $manager->decode($request->file('avatar'));

        // Cover-crop to a square and resize to 400x400.
        $image = $image->cover(400, 400);

        $encoded = $image->encode(new WebpEncoder(quality: 80));

        $filename = 'avatars/'.$user->id.'-'.uniqid().'.webp';

        Storage::disk('public')->put($filename, $encoded->toString());

        // Delete the previous avatar if it exists.
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->update(['avatar' => $filename]);

        return ApiResponse::success(
            new UserResource($user->load('department', 'roles')),
            'Profile photo updated successfully.'
        );
    }
}
