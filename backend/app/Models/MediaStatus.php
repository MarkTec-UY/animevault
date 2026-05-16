<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaStatus extends Model
{
    protected $table = 'media_status';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function anime(): HasMany
    {
        return $this->hasMany(Anime::class, 'status_code', 'code');
    }

    public function manga(): HasMany
    {
        return $this->hasMany(Manga::class, 'status_code', 'code');
    }

    public function mediaReferences(): HasMany
    {
        return $this->hasMany(MediaReference::class, 'status_code', 'code');
    }
}
