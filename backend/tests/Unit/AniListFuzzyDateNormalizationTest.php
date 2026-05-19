<?php

use App\Services\AniList\Concerns\SyncsAniListMediaData;

test('it returns null for invalid fuzzy dates from AniList', function () {
    $normalizer = new class
    {
        use SyncsAniListMediaData;

        public function normalize(mixed $value): ?string
        {
            return $this->normalizeFuzzyDate($value);
        }
    };

    expect($normalizer->normalize([
        'year' => 2016,
        'month' => 5,
        'day' => 58,
    ]))->toBeNull()
        ->and($normalizer->normalize([
            'year' => 2024,
            'month' => 2,
            'day' => 30,
        ]))->toBeNull()
        ->and($normalizer->normalize([
            'year' => 2015,
            'month' => 5,
            'day' => 30,
        ]))->toBe('2015-05-30');
});
