<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    protected $table = 'schema_staff.staff';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'date_of_birth' => 'date',
            'date_of_death' => 'date',
            'age_years' => 'integer',
            'years_active_start' => 'integer',
            'years_active_end' => 'integer',
            'favourites' => 'integer',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(StaffNameAlias::class, 'staff_id');
    }

    public function primaryOccupations(): HasMany
    {
        return $this->hasMany(StaffPrimaryOccupation::class, 'staff_id');
    }

    public function mediaEntries(): HasMany
    {
        return $this->hasMany(MediaStaff::class, 'staff_id');
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(MediaReference::class, 'schema_staff.media_staff', 'staff_id', 'media_id', 'id', 'id')
            ->withPivot('role_name', 'sort_order', 'created_at');
    }

    public function voicedCharacters(): HasMany
    {
        return $this->hasMany(MediaCharacterVoiceActor::class, 'staff_id');
    }
}
