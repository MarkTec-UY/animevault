<?php

namespace App\Console\Commands;

use App\Services\AniList\AniListAnimeImporter;
use Illuminate\Console\Command;

class ImportAniListAnime extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'anilist:import-anime
                            {--limit=50 : Cantidad de animes a importar}
                            {--start-id=1 : ID desde el que se empieza a recorrer}
                            {--start-page=1 : Pagina inicial de AniList desde la que se empieza a recorrer}
                            {--per-page=50 : Cantidad de animes a pedir por request a AniList}
                            {--resume : Reanuda desde el ultimo checkpoint guardado por el importador}
                            {--reset-checkpoint : Borra el checkpoint guardado antes de empezar}
                            {--delay=2200 : Pausa entre requests en milisegundos}
                            {--max-rate-limit-retries=10 : Reintentos automaticos cuando AniList responde 429}
                            {--max-server-error-retries=3 : Reintentos automaticos cuando AniList responde 5xx}
                            {--start-year=0 : Anio inicial para la importacion por rangos de fecha (0 incluye registros sin fecha y luego continua desde 1900)};
                            {--use-cursors : Usa paginacion por rangos de fecha en lugar de page-based (evita el limite de 100 paginas de la API publica)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa anime desde AniList GraphQL y lo persiste en PostgreSQL';

    /**
     * Execute the console command.
     */
    public function handle(AniListAnimeImporter $importer): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $startId = max(1, (int) $this->option('start-id'));
        $startPage = max(1, (int) $this->option('start-page'));
        $startYear = max(0, (int) $this->option('start-year'));
        $perPage = min(max(1, (int) $this->option('per-page')), 50);
        $useCursors = (bool) $this->option('use-cursors');
        $resume = (bool) $this->option('resume');
        $resetCheckpoint = (bool) $this->option('reset-checkpoint');
        $delay = max(0, (int) $this->option('delay'));
        $maxRateLimitRetries = max(0, (int) $this->option('max-rate-limit-retries'));
        $maxServerErrorRetries = max(0, (int) $this->option('max-server-error-retries'));

        if ($resetCheckpoint) {
            $importer->forgetImportCheckpoint();
            $this->line('Checkpoint del importador borrado.');
        }

        $checkpoint = $resume ? $importer->readImportCheckpoint() : null;

        if ($resume && $checkpoint !== null) {
            $checkpointMode = $checkpoint['mode'] ?? 'page';

            if ($useCursors && $checkpointMode === 'date_range') {
                $startYear = max($startYear, (int) ($checkpoint['next_year'] ?? 0));
                $startPage = max(1, (int) $checkpoint['next_page']);
                $startId = max($startId, (int) $checkpoint['next_start_id']);
                $this->line(
                    "Reanudando importacion por rangos desde el anio {$startYear}, pagina {$startPage}."
                );
            }

            if (! $useCursors && $checkpointMode === 'page') {
                $startPage = max($startPage, (int) $checkpoint['next_page']);
                $startId = max($startId, (int) $checkpoint['next_start_id']);
                $this->line(
                    "Reanudando importacion paginada desde la pagina {$startPage} con ID inicial {$startId}."
                );
            }
        }

        if ($useCursors) {
            $this->info(
                "Importando {$limit} animes desde AniList usando rangos de fecha desde el anio {$startYear}, con lotes de {$perPage}..."
            );
        } else {
            $this->info(
                "Importando {$limit} animes desde AniList con paginacion clasica desde la pagina {$startPage}, con lotes de {$perPage}..."
            );
        }

        if ($delay > 0 && $delay < 1000) {
            $this->warn("El delay se interpreta en milisegundos. Ahora mismo estas usando {$delay}ms por request.");
        }

        if ($startId > 1) {
            $this->line("Se filtraran localmente los resultados para importar solo IDs >= {$startId}.");
        }

        $summary = $useCursors
            ? $importer->importAllAnimeWithCursors(
                limit: $limit,
                startId: $startId,
                perPage: $perPage,
                startYear: $startYear,
                startPage: $startPage,
                delayMs: $delay,
                maxRateLimitRetries: $maxRateLimitRetries,
                maxServerErrorRetries: $maxServerErrorRetries,
                output: $this->output,
            )
            : $importer->importFirstAvailableAnime(
                limit: $limit,
                startId: $startId,
                startPage: $startPage,
                perPage: $perPage,
                delayMs: $delay,
                maxRateLimitRetries: $maxRateLimitRetries,
                maxServerErrorRetries: $maxServerErrorRetries,
                output: $this->output,
            );

        $this->newLine();
        $this->info('Importacion terminada.');
        $this->line("Animes importados: {$summary['imported']}");
        $this->line("Animes revisados: {$summary['checked']}");
        $this->line("Requests realizadas: {$summary['pages']}");
        $this->line("Ultimo ID importado: {$summary['last_id']}");

        return self::SUCCESS;
    }
}
