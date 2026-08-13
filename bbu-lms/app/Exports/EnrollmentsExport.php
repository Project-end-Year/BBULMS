<?php

namespace App\Exports;

use App\Models\Enrollment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class EnrollmentsExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Enrollment::with(['student', 'courseOffering.course', 'courseOffering.semester'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Enrollment $enrollment) => [
                'id' => $enrollment->id,
                'student_name' => $enrollment->student?->name,
                'student_email' => $enrollment->student?->email,
                'course_code' => $enrollment->courseOffering?->course?->code,
                'course_name' => $enrollment->courseOffering?->course?->name,
                'semester' => $enrollment->courseOffering?->semester?->name,
                'status' => $enrollment->status,
                'enrolled_at' => $enrollment->enrolled_at?->format('Y-m-d H:i:s'),
                'created_at' => $enrollment->created_at?->format('Y-m-d H:i:s'),
            ]);
    }

    public function headings(): array
    {
        return ['ID', 'Student Name', 'Student Email', 'Course Code', 'Course Name', 'Semester', 'Status', 'Enrolled At', 'Created At'];
    }
}
