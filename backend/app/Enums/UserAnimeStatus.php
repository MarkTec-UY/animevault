<?php

namespace App\Enums;

enum UserAnimeStatus: string
{
    case Watching = 'watching';
    case Completed = 'completed';
    case Paused = 'paused';
    case Dropped = 'dropped';
    case Planning = 'planning';
}
