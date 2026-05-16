<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaType extends Model
{
    protected $table = 'media_type';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'type_code', 'code');
    }

    public function mediaReferences(): HasMany
    {
        return $this->hasMany(MediaReference::class, 'type_code', 'code');
    }
}
