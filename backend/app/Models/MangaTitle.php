<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MangaTitle extends Model
{
    protected $table = 'schema_manga.manga_title';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    public function manga(): BelongsTo
    {
        return $this->belongsTo(Manga::class, 'manga_id');
    }
}
