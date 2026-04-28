<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function view(User $user, User $target): bool
    {
        return $target->isProfilePubliclyVisible() || $user->id === $target->id;
    }

    public function viewLibrary(User $user, User $target): bool
    {
        return $target->isProfilePubliclyVisible() || $user->id === $target->id;
    }

    public function viewFavorites(User $user, User $target): bool
    {
        return $target->isProfilePubliclyVisible() || $user->id === $target->id;
    }

    public function updateProfile(User $user, User $target): bool
    {
        return $user->id === $target->id;
    }

    public function manageLibrary(User $user, User $target): bool
    {
        return $user->id === $target->id;
    }

    public function manageFavorites(User $user, User $target): bool
    {
        return $user->id === $target->id;
    }
}
