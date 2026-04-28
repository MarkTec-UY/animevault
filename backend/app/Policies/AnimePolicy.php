<?php

namespace App\Policies;

use App\Models\Anime;
use App\Models\User;

class AnimePolicy
{
    public function view(User $user, Anime $anime): bool
    {
        return true;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }
}
