<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'about_me' => ['nullable', 'string', 'max:1000'],
            'avatar' => ['nullable', 'image', 'max:2048', 'mimes:jpeg,png,jpg,gif,webp'],
            'banner' => ['nullable', 'image', 'max:4096', 'mimes:jpeg,png,jpg,gif,webp'],
            'remove_avatar' => ['nullable', 'boolean'],
            'remove_banner' => ['nullable', 'boolean'],
            'timezone' => ['nullable', 'string', Rule::in(User::allowedTimezones())],
            'is_profile_public' => ['nullable', 'boolean'],
            'preferred_title_language' => ['nullable', 'string', Rule::in(User::allowedPreferredTitleLanguages())],
            'preferred_scoring_system' => ['nullable', 'string', Rule::in(User::allowedPreferredScoringSystems())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.max' => 'The avatar must not be larger than 2MB.',
            'banner.max' => 'The banner must not be larger than 4MB.',
            'avatar.mimes' => 'The avatar must be a JPEG, PNG, JPG, GIF, or WebP image.',
            'banner.mimes' => 'The banner must be a JPEG, PNG, JPG, GIF, or WebP image.',
            'timezone.in' => 'The selected timezone is invalid.',
            'preferred_title_language.in' => 'The selected title language is invalid.',
            'preferred_scoring_system.in' => 'The selected scoring system is invalid.',
        ];
    }
}
