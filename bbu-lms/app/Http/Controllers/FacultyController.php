<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\Faculty;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'isActive' => ['nullable', 'boolean'],
            'perPage' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Faculty::query()
            ->orderBy('name', 'asc');

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (isset($validated['isActive'])) {
            $query->where('is_active', $validated['isActive']);
        }

        $perPage = $validated['perPage'] ?? 100;

        $faculties = $query->paginate($perPage)->withQueryString();

        return ApiResponse::success([
            'faculties' => $faculties->items(),
            'pagination' => [
                'currentPage' => $faculties->currentPage(),
                'lastPage' => $faculties->lastPage(),
                'perPage' => $faculties->perPage(),
                'total' => $faculties->total(),
                'from' => $faculties->firstItem(),
                'to' => $faculties->lastItem(),
            ],
        ]);
    }
}
