<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaSeason extends Model
{
    protected $table = 'media_season';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): HasMany
    {
        return $this->hasMany(Anime::class, 'season_code', 'code');
    }
}
