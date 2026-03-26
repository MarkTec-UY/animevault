<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\PersonalAccessToken;

beforeEach(function (): void {
    recreateAuthTables();
});

it('registers a user and returns a sanctum token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Jose',
        'email' => 'jose@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'jose@example.com')
        ->assertJsonPath('token_type', 'Bearer');

    expect(User::query()->count())->toBe(1)
        ->and(PersonalAccessToken::query()->count())->toBe(1);
});

it('logs in a user and returns a sanctum token', function () {
    $user = User::factory()->create([
        'email' => 'jose@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jose@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('token_type', 'Bearer');

    expect(PersonalAccessToken::query()->count())->toBe(1);
});

it('rejects invalid login credentials', function () {
    User::factory()->create([
        'email' => 'jose@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jose@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertUnauthorized()
        ->assertJson([
            'message' => 'The provided credentials are incorrect.',
        ]);
});

it('returns the authenticated user via sanctum', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->getJson('/api/v1/auth/me');

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('user.email', $user->email);
});

it('returns 401 for unauthenticated auth me requests without redirecting', function () {
    $response = $this->get('/api/v1/auth/me');

    $response->assertUnauthorized()
        ->assertJson([
            'message' => 'Unauthenticated.',
        ]);
});

it('logs out by revoking the current sanctum token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $response = $this
        ->withToken($token)
        ->postJson('/api/v1/auth/logout');

    $response->assertOk()
        ->assertJson([
            'message' => 'Logged out successfully.',
        ]);

    expect(PersonalAccessToken::query()->count())->toBe(0);
});

function recreateAuthTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('personal_access_tokens');
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table): void {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->text('about_me')->nullable();
        $table->string('avatar_path')->nullable();
        $table->string('banner_path')->nullable();
        $table->string('timezone')->default('UTC');
        $table->boolean('is_profile_public')->default(true);
        $table->string('preferred_title_language')->default('english');
        $table->string('preferred_scoring_system')->default('point_10');
        $table->rememberToken();
        $table->timestamps();
    });

    Schema::create('personal_access_tokens', function (Blueprint $table): void {
        $table->id();
        $table->morphs('tokenable');
        $table->text('name');
        $table->string('token', 64)->unique();
        $table->text('abilities')->nullable();
        $table->timestamp('last_used_at')->nullable();
        $table->timestamp('expires_at')->nullable()->index();
        $table->timestamps();
    });

    Schema::enableForeignKeyConstraints();
}
