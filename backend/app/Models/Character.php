<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Character extends Model
{
    protected $table = 'schema_characters.character';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'date_of_birth' => 'date',
            'favourites' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(CharacterNameAlias::class, 'character_id');
    }

    public function mediaEntries(): HasMany
    {
        return $this->hasMany(MediaCharacter::class, 'character_id');
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(MediaReference::class, 'schema_characters.media_character', 'character_id', 'media_id', 'id', 'id')
            ->withPivot('role_code', 'character_name_override', 'sort_order', 'created_at');
    }

    public function voiceActorEntries(): HasMany
    {
        return $this->hasMany(MediaCharacterVoiceActor::class, 'character_id');
    }
}
