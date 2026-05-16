<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CharacterNameAlias extends Model
{
    protected $table = 'schema_characters.character_name_alias';

    public $incrementing = false;

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'character_id' => 'integer',
            'is_spoiler' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class, 'character_id');
    }
}
