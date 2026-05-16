<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Media extends Model
{
    protected $table = 'schema_core.media';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function typeReference(): BelongsTo
    {
        return $this->belongsTo(MediaType::class, 'type_code', 'code');
    }

    public function anime(): HasOne
    {
        return $this->hasOne(Anime::class, 'id', 'id');
    }

    public function manga(): HasOne
    {
        return $this->hasOne(Manga::class, 'id', 'id');
    }
}
