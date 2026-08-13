<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class UsersExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return User::with(['roles', 'department'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name')->sort()->implode(', '),
                'department' => $user->department?->name,
                'active' => $user->is_active ? 'Yes' : 'No',
                'created_at' => $user->created_at?->format('Y-m-d H:i:s'),
            ]);
    }

    public function headings(): array
    {
        return ['ID', 'Name', 'Email', 'Phone', 'Roles', 'Department', 'Active', 'Created At'];
    }
}
