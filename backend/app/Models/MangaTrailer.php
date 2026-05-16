<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MangaTrailer extends Model
{
    protected $table = 'schema_manga.manga_trailer';

    protected $primaryKey = 'manga_id';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'manga_id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function manga(): BelongsTo
    {
        return $this->belongsTo(Manga::class, 'manga_id', 'id');
    }
}
