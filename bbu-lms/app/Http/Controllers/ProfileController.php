<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Http\Resources\UserResource;
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
