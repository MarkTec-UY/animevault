<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaReference extends Model
{
    protected $table = 'media_reference';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'is_adult' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function typeReference(): BelongsTo
    {
        return $this->belongsTo(MediaType::class, 'type_code', 'code');
    }

    public function formatReference(): BelongsTo
    {
        return $this->belongsTo(MediaFormat::class, 'format_code', 'code');
    }

    public function statusReference(): BelongsTo
    {
        return $this->belongsTo(MediaStatus::class, 'status_code', 'code');
    }

}
