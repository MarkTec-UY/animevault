<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

beforeEach(function (): void {
    recreateAuthTables();
});

it('registers a user and authenticates via session', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'username' => 'Jose',
        'email' => 'jose@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.email', 'jose@example.com')
        ->assertJsonPath('user.role', 'user')
        ->assertJsonPath('user.permissions.can_manage_news', false)
        ->assertJsonMissing(['token']);

    expect(User::query()->count())->toBe(1);
});

it('forces newly registered users to keep the default reader role', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'username' => 'Jose',
        'email' => 'jose@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'admin',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.role', 'user')
        ->assertJsonPath('user.permissions.can_manage_news', false);

    expect(User::query()->sole()->resolvedRole()->value)->toBe('user');
});

it('logs in a user and authenticates via session', function () {
    $user = User::factory()->create([
        'email' => 'jose@example.com',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jose@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonMissing(['token', 'token_type', 'expires_at']);
});

it('rejects invalid login credentials', function () {
    User::factory()->create([
        'email' => 'jose@example.com',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => 'jose@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'message' => 'The username field is required.',
            'errors' => [
                'username' => ['The username field is required.'],
            ],
        ]);
});

it('returns the authenticated user via session', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
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

it('logs out the authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/v1/auth/logout');

    $response->assertOk()
        ->assertJson([
            'message' => 'Logged out successfully.',
        ]);
});

it('blocks editorial routes for non-editor users', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/editor/session')
        ->assertForbidden()
        ->assertJson([
            'message' => 'You do not have permission to access this resource.',
        ]);
});

it('allows editors to access editorial routes', function () {
    $editor = User::factory()->editor()->create();

    $this->actingAs($editor)
        ->getJson('/api/v1/editor/session')
        ->assertOk()
        ->assertJsonPath('user.id', $editor->id)
        ->assertJsonPath('user.role', 'editor')
        ->assertJsonPath('user.permissions.can_manage_news', true);
});

it('allows admins to access editorial routes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->getJson('/api/v1/editor/session')
        ->assertOk()
        ->assertJsonPath('user.id', $admin->id)
        ->assertJsonPath('user.role', 'admin')
        ->assertJsonPath('user.permissions.can_manage_news', true);
});

it('blocks editor routes when the user has no editorial role', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/v1/editor/session')
        ->assertForbidden()
        ->assertJson([
            'message' => 'You do not have permission to access this resource.',
        ]);
});

it('blocks editor routes when an old editor is downgraded', function () {
    $editor = User::factory()->editor()->create();

    User::query()
        ->whereKey($editor->id)
        ->update([
            'role' => 'user',
        ]);

    $this->actingAs($editor)
        ->getJson('/api/v1/editor/session')
        ->assertForbidden()
        ->assertJson([
            'message' => 'You do not have permission to access this resource.',
        ]);
});

it('rate limits repeated login attempts', function () {
    User::factory()->create([
        'email' => 'jose@example.com',
    ]);

    foreach (range(1, 5) as $attempt) {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'jose@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    $this->postJson('/api/v1/auth/login', [
        'email' => 'jose@example.com',
        'password' => 'wrong-password',
    ])->assertStatus(429)
        ->assertJson([
            'message' => 'Too many login attempts. Please try again in a minute.',
        ]);
});

it('adds baseline security headers to api responses', function () {
    $this->getJson('/api/v1/ping')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->assertHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
});

function recreateAuthTables(): void
{
    Schema::disableForeignKeyConstraints();

    Schema::dropIfExists('personal_access_tokens');
    Schema::dropIfExists('users');

    Schema::create('users', function (Blueprint $table): void {
        $table->id();
        $table->string('username');
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->string('role')->default('user');
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
