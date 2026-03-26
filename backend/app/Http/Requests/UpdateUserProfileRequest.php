<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'about_me' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'banner' => ['sometimes', 'nullable', 'image', 'max:8192'],
            'remove_avatar' => ['sometimes', 'boolean'],
            'remove_banner' => ['sometimes', 'boolean'],
            'timezone' => ['sometimes', 'string', Rule::in(timezone_identifiers_list())],
            'is_profile_public' => ['sometimes', 'boolean'],
            'preferred_title_language' => ['sometimes', 'string', Rule::in(User::allowedPreferredTitleLanguages())],
            'preferred_scoring_system' => ['sometimes', 'string', Rule::in(User::allowedPreferredScoringSystems())],
        ];
    }
}
