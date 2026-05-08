<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'username' => fake()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password123'),
            'about_me' => null,
            'avatar_path' => null,
            'banner_path' => null,
            'timezone' => User::DEFAULT_TIMEZONE,
            'is_profile_public' => true,
            'preferred_title_language' => User::DEFAULT_PREFERRED_TITLE_LANGUAGE,
            'preferred_scoring_system' => User::DEFAULT_PREFERRED_SCORING_SYSTEM,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function editor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Editor->value,
        ]);
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin->value,
        ]);
    }
}
