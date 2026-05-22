<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Ventanas basadas en la grilla actual de AnimeSchedule.net para la semana
// del 18 al 24 de mayo de 2026, convertida de BST a GMT-03 (Montevideo).
// Se priorizan los bloques donde suelen salir episodios de anime TV de forma
// regular, ignorando estrenos aislados de madrugada/casi medianoche.
$airingRefreshWindows = [
    1 => ['10:00', '14:00'], // Lunes
    2 => ['09:30', '14:30'], // Martes
    3 => ['07:30', '14:30'], // Miercoles
    4 => ['07:30', '14:30'], // Jueves
    5 => ['09:30', '14:00'], // Viernes
    6 => ['05:00', '14:30'], // Sabado
    7 => ['05:30', '13:30'], // Domingo
];

$shouldRunAiringRefresh = static function () use ($airingRefreshWindows): bool {
    $now = now('America/Montevideo');
    $window = $airingRefreshWindows[$now->isoWeekday()] ?? null;

    if (!$window) {
        return false;
    }

    [$startTime, $endTime] = $window;

    $startsAt = $now->copy()->setTimeFromTimeString($startTime);
    $endsAt = $now->copy()->setTimeFromTimeString($endTime);

    return $now->greaterThanOrEqualTo($startsAt)
        && $now->lessThanOrEqualTo($endsAt);
};

Schedule::command('anilist:refresh-airing-anime')
    ->timezone('America/Montevideo')
    ->everyFiveMinutes()
    ->when($shouldRunAiringRefresh)
    ->appendOutputTo(storage_path('logs/scheduler.log'))
    ->withoutOverlapping();

Schedule::command('anilist:refresh-trending-anime')
    ->timezone('America/Montevideo')
    ->everyTwoHours()
    ->appendOutputTo(storage_path('logs/scheduler.log'))
    ->withoutOverlapping();