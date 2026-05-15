<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaRelation extends Model
{
    protected $table = 'media_relation';

    protected $primaryKey = 'code';

    public $incrementing = false;

    protected $keyType = 'string';

    public $timestamps = false;

    protected $guarded = [];
}
