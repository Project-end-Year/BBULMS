<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Services\AdminDashboardService;

class AdminDashboardController extends Controller
{
    public function __construct(private AdminDashboardService $service) {}

    /**
     * Return the admin dashboard summary payload.
     */
    public function index()
    {
        return ApiResponse::success($this->service->summary());
    }
}
