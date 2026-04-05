<?php

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function (): void {
    recreateUserProfileTables();
    Storage::fake('public');
});

it('updates the authenticated user profile preferences and about me text', function () {
    $user = User::factory()->create([
        'timezone' => 'UTC',
        'is_profile_public' => true,
        'preferred_title_language' => 'english',
        'preferred_scoring_system' => 'point_10',
    ]);

    Sanctum::actingAs($user);

    $response = $this->putJson('/api/v1/me/profile', [
        'about_me' => 'I collect retro anime VHS tapes.',
        'timezone' => 'America/Montevideo',
        'is_profile_public' => false,
        'preferred_title_language' => 'native',
        'preferred_scoring_system' => 'point_100',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.about_me', 'I collect retro anime VHS tapes.')
        ->assertJsonPath('user.timezone', 'America/Montevideo')
        ->assertJsonPath('user.is_profile_public', false)
        ->assertJsonPath('user.preferred_title_language', 'native')
        ->assertJsonPath('user.preferred_scoring_system', 'point_100');

    expect($user->refresh())
        ->about_me->toBe('I collect retro anime VHS tapes.')
        ->timezone->toBe('America/Montevideo')
        ->is_profile_public->toBeFalse()
        ->preferred_title_language->toBe('native')
        ->preferred_scoring_system->toBe('point_100');
});

it('rejects timezone values not in the supported timezone list', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $this->putJson('/api/v1/me/profile', [
        'timezone' => 'Mars/Phobos',
    ])->assertUnprocessable();
});

it('provides timezone options in auth me response', function () {
    $user = User::factory()->create();

    $token = $user->createToken('test-token')->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('user.role', 'user')
        ->assertJsonPath('user.permissions.can_manage_news', false)
        ->assertJsonPath('timezone_options.0.value', 'Pacific/Pago_Pago')
        ->assertJsonPath('timezone_options.0.label', '(GMT-11:00) Pago Pago');
});

it('uploads avatar and banner images for the authenticated user', function () {
    $user = User::factory()->create();

    Sanctum::actingAs($user);

    $response = $this->put('/api/v1/me/profile', [
        'avatar' => UploadedFile::fake()->image('avatar.jpg', 256, 256),
        'banner' => UploadedFile::fake()->image('banner.jpg', 1200, 400),
    ]);

    $response->assertOk()
        ->assertJsonPath('user.avatar_url', fn (string $value): bool => str_contains($value, '/storage/user-profile/'))
        ->assertJsonPath('user.banner_url', fn (string $value): bool => str_contains($value, '/storage/user-profile/'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull()
        ->and($user->banner_path)->not->toBeNull()
        ->and(Storage::disk('public')->exists($user->avatar_path))->toBeTrue()
        ->and(Storage::disk('public')->exists($user->banner_path))->toBeTrue();
});

it('removes existing avatar and banner images when requested', function () {
    $user = User::factory()->create([
        'avatar_path' => 'user-profile/1/avatars/old-avatar.jpg',
        'banner_path' => 'user-profile/1/banners/old-banner.jpg',
    ]);

    Storage::disk('public')->put($user->avatar_path, 'avatar');
    Storage::disk('public')->put($user->banner_path, 'banner');

    Sanctum::actingAs($user);

    $response = $this->putJson('/api/v1/me/profile', [
        'remove_avatar' => true,
        'remove_banner' => true,
    ]);

    $response->assertOk()
        ->assertJsonPath('user.avatar_url', null)
        ->assertJsonPath('user.banner_url', null);

    $user->refresh();

    expect($user->avatar_path)->toBeNull()
        ->and($user->banner_path)->toBeNull()
        ->and(Storage::disk('public')->exists('user-profile/1/avatars/old-avatar.jpg'))->toBeFalse()
        ->and(Storage::disk('public')->exists('user-profile/1/banners/old-banner.jpg'))->toBeFalse();
});

it('returns public profiles and hides private ones', function () {
    $publicUser = User::factory()->create([
        'name' => 'Jose',
        'about_me' => 'Watching seasonal anime every week.',
        'is_profile_public' => true,
    ]);

    $privateUser = User::factory()->create([
        'is_profile_public' => false,
    ]);

    $this->getJson("/api/v1/users/{$publicUser->id}")
        ->assertOk()
        ->assertJsonPath('user.name', 'Jose')
        ->assertJsonPath('user.about_me', 'Watching seasonal anime every week.')
        ->assertJsonMissingPath('user.email');

    $this->getJson("/api/v1/users/{$privateUser->id}")
        ->assertNotFound()
        ->assertJson([
            'message' => 'User profile not found.',
        ]);
});

it('returns profile preferences in auth me responses', function () {
    $user = User::factory()->create([
        'about_me' => 'Blue Box enjoyer.',
        'timezone' => 'America/Montevideo',
        'is_profile_public' => false,
        'preferred_title_language' => 'romaji',
        'preferred_scoring_system' => 'star_5',
    ]);

    $token = $user->createToken('test-token')->plainTextToken;

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('user.about_me', 'Blue Box enjoyer.')
        ->assertJsonPath('user.timezone', 'America/Montevideo')
        ->assertJsonPath('user.is_profile_public', false)
        ->assertJsonPath('user.preferred_title_language', 'romaji')
        ->assertJsonPath('user.preferred_scoring_system', 'star_5');
});

function recreateUserProfileTables(): void
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
