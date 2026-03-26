<?php

namespace App\Http\Requests;

use App\Enums\UserAnimeStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpsertUserAnimeLibraryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::enum(UserAnimeStatus::class)],
            'progress_episodes' => ['nullable', 'integer', 'min:0'],
            'score' => ['nullable', 'integer', 'between:1,10'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
        ];
    }
}
