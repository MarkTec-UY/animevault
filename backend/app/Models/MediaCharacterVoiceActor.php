<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaCharacterVoiceActor extends Model
{
    protected $table = 'schema_characters.media_character_voice_actor';

    protected $guarded = [];

    public $timestamps = false;

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'media_id' => 'integer',
            'character_id' => 'integer',
            'staff_id' => 'integer',
            'sort_order' => 'integer',
            'created_at' => 'datetime',
        ];
    }

    public function mediaReference(): BelongsTo
    {
        return $this->belongsTo(MediaReference::class, 'media_id', 'id');
    }

    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class, 'character_id');
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
