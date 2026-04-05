<?php

namespace App\Enums;

enum ApiTokenAbility: string
{
    case Authenticated = 'authenticated';
    case ManageNews = 'manage-news';
}
