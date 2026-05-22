<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Cache; // Añade esta importación

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('anilist:refresh-airing-anime')
    ->everyFiveMinutes()
    ->appendOutputTo(storage_path('logs/scheduler.log'))
    ->withoutOverlapping();

// Modificación para el segundo script
Schedule::command('anilist:refresh-trending-anime')
    ->everyMinute() // Evaluamos cada minuto
    ->when(function () {
        // Obtenemos la próxima fecha de ejecución esperada
        $nextRun = Cache::get('next_run_trending_anime');
        
        // Si no hay fecha (primera vez) o ya pasamos la fecha programada, ejecutamos
        return !$nextRun || now()->greaterThanOrEqualTo($nextRun);
    })
    ->after(function () {
        // Una vez que termina de ejecutarse, calculamos el próximo salto aleatorio (entre 60 y 120 minutos)
        $randomMinutes = rand(60, 120);
        Cache::put('next_run_trending_anime', now()->addMinutes($randomMinutes));
    })
    ->appendOutputTo(storage_path('logs/scheduler.log'))
    ->withoutOverlapping();