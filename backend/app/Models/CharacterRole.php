<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CharacterRole extends Model
{
    protected $table = 'schema_characters.character_role';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function mediaCharacters(): HasMany
    {
        return $this->hasMany(MediaCharacter::class, 'role_code', 'code');
    }
}
