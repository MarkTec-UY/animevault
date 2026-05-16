<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnimeRelation extends Model
{
    protected $table = 'anime_relation';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'anime_id' => 'integer',
            'related_media_id' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function anime(): BelongsTo
    {
        return $this->belongsTo(Anime::class, 'anime_id', 'id');
    }

    public function relatedMedia(): BelongsTo
    {
        return $this->belongsTo(MediaReference::class, 'related_media_id', 'id');
    }

    public function relationType(): BelongsTo
    {
        return $this->belongsTo(MediaRelation::class, 'relation_type_code', 'code');
    }
}
