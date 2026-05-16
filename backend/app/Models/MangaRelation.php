<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MangaRelation extends Model
{
    protected $table = 'schema_manga.manga_relation';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'manga_id' => 'integer',
            'related_media_id' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function manga(): BelongsTo
    {
        return $this->belongsTo(Manga::class, 'manga_id', 'id');
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
