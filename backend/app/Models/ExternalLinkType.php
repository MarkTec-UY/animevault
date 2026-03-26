<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExternalLinkType extends Model
{
    protected $table = 'external_link_type';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];

    public function externalLinks(): HasMany
    {
        return $this->hasMany(ExternalLink::class, 'type_code', 'code');
    }
}
