<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('scope', 20)->default('course')->after('course_id');
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete()->after('scope');

            $table->index(['scope']);
            $table->index(['department_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropIndex(['scope']);
            $table->dropIndex(['department_id']);
            $table->dropColumn(['scope', 'department_id']);
        });
    }
};
