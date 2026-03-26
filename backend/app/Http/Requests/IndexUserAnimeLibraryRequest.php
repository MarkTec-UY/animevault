<?php

namespace App\Http\Requests;

use App\Enums\UserAnimeStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexUserAnimeLibraryRequest extends FormRequest
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
            'status' => ['nullable', 'array'],
            'status.*' => ['string', Rule::enum(UserAnimeStatus::class)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'status' => $this->normalizeArrayInput('status'),
        ]);
    }

    /**
     * @return list<string>|null
     */
    private function normalizeArrayInput(string $key): ?array
    {
        $value = $this->input($key);

        if ($value === null) {
            return null;
        }

        $items = is_array($value) ? $value : explode(',', (string) $value);

        $normalizedItems = collect($items)
            ->map(fn (mixed $item): string => trim((string) $item))
            ->filter(fn (string $item): bool => $item !== '')
            ->values()
            ->all();

        return $normalizedItems === [] ? null : $normalizedItems;
    }
}
