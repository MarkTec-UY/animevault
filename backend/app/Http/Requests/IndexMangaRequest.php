<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexMangaRequest extends FormRequest
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
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'array'],
            'status.*' => ['string', 'max:50'],
            'format' => ['nullable', 'array'],
            'format.*' => ['string', 'max:50'],
            'source' => ['nullable', 'array'],
            'source.*' => ['string', 'max:50'],
            'genres' => ['nullable', 'array'],
            'genres.*' => ['string', 'max:100'],
            'year' => ['nullable', 'integer', 'between:1900,2100'],
            'is_adult' => ['nullable', 'boolean'],
            'sort' => [
                'nullable',
                'string',
                Rule::in([
                    'popularity_desc',
                    'score_desc',
                    'favourites_desc',
                    'recently_updated',
                    'start_date_desc',
                    'title_asc',
                ]),
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'search' => $this->normalizeSearch($this->input('search')),
            'status' => $this->normalizeArrayInput('status'),
            'format' => $this->normalizeArrayInput('format'),
            'source' => $this->normalizeArrayInput('source'),
            'genres' => $this->normalizeArrayInput('genres'),
            'is_adult' => $this->normalizeBooleanInput('is_adult'),
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

    private function normalizeSearch(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalizedValue = trim((string) $value);

        return $normalizedValue === '' ? null : $normalizedValue;
    }

    private function normalizeBooleanInput(string $key): mixed
    {
        $value = $this->input($key);

        if ($value === null || is_bool($value)) {
            return $value;
        }

        $normalizedValue = strtolower(trim((string) $value));

        return match ($normalizedValue) {
            '' => null,
            'true', '1' => true,
            'false', '0' => false,
            default => $value,
        };
    }
}
