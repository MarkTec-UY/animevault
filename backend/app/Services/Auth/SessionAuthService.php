<?php

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class SessionAuthService
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function register(Request $request, array $attributes): User
    {
        $user = User::query()->create([
            ...$attributes,
            'role' => UserRole::User->value,
        ]);

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return $user->fresh();
    }

    public function authenticate(LoginRequest $request): User
    {
        $credentials = $request->safe()->only(['email', 'password']);

        if (! Auth::guard('web')->attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = $request->user();

        return $user->fresh();
    }

    public function logout(Request $request): void
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
    }
}
