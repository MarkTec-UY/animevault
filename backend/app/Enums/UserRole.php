<?php

namespace App\Enums;

enum UserRole: string
{
    case User = 'user';
    case Editor = 'editor';
    case Admin = 'admin';

    public function canManageNews(): bool
    {
        return match ($this) {
            self::Editor, self::Admin => true,
            self::User => false,
        };
    }
}
