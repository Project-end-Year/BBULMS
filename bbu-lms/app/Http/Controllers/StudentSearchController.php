<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class StudentSearchController extends Controller
{
    /**
     * Search active students by name or email.
     *
     * Limited to administrators and lecturers.
     */
    public function __invoke(Request $request)
    {
        $user = $this->requireUser();

        if (! $user->hasRole('admin') && ! $user->hasRole('lecturer')) {
            abort(403, 'Only administrators and lecturers can search students.');
        }

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);

        $search = $validated['query'];

        $query = User::role('student')
            ->where('is_active', true)
            ->with('studentProfile')
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('studentProfile', function ($sq) use ($search) {
                        $sq->where('student_id', 'like', "%{$search}%");
                    });
            });

        $students = $query->orderBy('name')->limit($validated['limit'] ?? 10)->get();

        return ApiResponse::success([
            'students' => $students->map(fn (User $student) => [
                'id' => $student->id,
                'name' => $student->name,
                'email' => $student->email,
                'studentId' => $student->studentProfile?->student_id,
            ]),
        ]);
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
