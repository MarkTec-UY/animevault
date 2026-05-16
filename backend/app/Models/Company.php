<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Company extends Model
{
    protected $table = 'company';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): BelongsToMany
    {
        return $this->belongsToMany(Anime::class, 'schema_anime.anime_company', 'company_id', 'anime_id')
            ->withPivot('is_main');
    }
}
