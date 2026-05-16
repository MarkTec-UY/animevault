<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MediaRelation extends Model
{
    protected $table = 'media_relation';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function animeRelations(): HasMany
    {
        return $this->hasMany(AnimeRelation::class, 'relation_type_code', 'code');
    }

    public function mangaRelations(): HasMany
    {
        return $this->hasMany(MangaRelation::class, 'relation_type_code', 'code');
    }
}
