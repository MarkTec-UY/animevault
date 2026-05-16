<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaFormat extends Model
{
    protected $table = 'media_format';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): HasMany
    {
        return $this->hasMany(Anime::class, 'format_code', 'code');
    }

    public function manga(): HasMany
    {
        return $this->hasMany(Manga::class, 'format_code', 'code');
    }

    public function mediaReferences(): HasMany
    {
        return $this->hasMany(MediaReference::class, 'format_code', 'code');
    }
}
