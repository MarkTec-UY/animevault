<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaStaff extends Model
{
    protected $table = 'schema_staff.media_staff';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'media_id' => 'integer',
            'staff_id' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function mediaReference(): BelongsTo
    {
        return $this->belongsTo(MediaReference::class, 'media_id', 'id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
