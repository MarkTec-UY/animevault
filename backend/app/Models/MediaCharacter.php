<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MediaCharacter extends Model
{
    protected $table = 'schema_characters.media_character';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'media_id' => 'integer',
            'character_id' => 'integer',
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

    public function role(): BelongsTo
    {
        return $this->belongsTo(CharacterRole::class, 'role_code', 'code');
    }

}
