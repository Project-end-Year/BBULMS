<?php

namespace App\Exports;

use App\Models\Course;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CoursesExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Course::with(['department', 'program'])
            ->orderBy('code')
            ->get()
            ->map(fn (Course $course) => [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
                'description' => $course->description,
                'credits' => $course->credits,
                'department' => $course->department?->name,
                'program' => $course->program?->name,
                'active' => $course->is_active ? 'Yes' : 'No',
                'created_at' => $course->created_at?->format('Y-m-d H:i:s'),
            ]);
    }

    public function headings(): array
    {
        return ['ID', 'Code', 'Name', 'Description', 'Credits', 'Department', 'Program', 'Active', 'Created At'];
    }
}
