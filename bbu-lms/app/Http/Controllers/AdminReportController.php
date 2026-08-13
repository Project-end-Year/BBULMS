<?php

namespace App\Http\Controllers;

use App\Exports\CoursesExport;
use App\Exports\EnrollmentsExport;
use App\Exports\UsersExport;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminReportController extends Controller
{
    public function users(): BinaryFileResponse
    {
        return Excel::download(new UsersExport, 'users_'.now()->format('Ymd_His').'.xlsx');
    }

    public function courses(): BinaryFileResponse
    {
        return Excel::download(new CoursesExport, 'courses_'.now()->format('Ymd_His').'.xlsx');
    }

    public function enrollments(): BinaryFileResponse
    {
        return Excel::download(new EnrollmentsExport, 'enrollments_'.now()->format('Ymd_His').'.xlsx');
    }
}
