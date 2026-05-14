<?php

namespace App\Services\AniList;

use Illuminate\Console\OutputStyle;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use RuntimeException;

class AniListAnimePageFetcher
{
    private const ENDPOINT = 'https://graphql.anilist.co';

    private const QUERY = <<<'GRAPHQL'
query ($page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media(type: ANIME, sort: ID) {
      id
      title { romaji english native }
      coverImage { color large }
      bannerImage
      description
      format
      status
      episodes
      duration
      season
      seasonYear
      source
      genres
      averageScore
      popularity
      isAdult
      favourites
      startDate { year month day }
      endDate { year month day }
      nextAiringEpisode {
        episode
        airingAt
      }
      studios {
        edges {
          isMain
          node { id name }
        }
      }
      tags {
        id
        name
        description
        category
        rank
      }
      externalLinks {
        id
        site
        url
        type
        language
        color
        icon
      }
      trends {
        edges {
          node {
            date
            trending
            popularity
          }
        }
      }
    }
  }
}
GRAPHQL;

    private const QUERY_BY_START_DATE_RANGE = <<<'GRAPHQL'
query ($page: Int!, $perPage: Int!, $startDateGreater: FuzzyDateInt, $startDateLesser: FuzzyDateInt) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media(type: ANIME, sort: ID, startDate_greater: $startDateGreater, startDate_lesser: $startDateLesser) {
      id
      title { romaji english native }
      coverImage { color large }
      bannerImage
      description
      format
      status
      episodes
      duration
      season
      seasonYear
      source
      genres
      averageScore
      popularity
      isAdult
      favourites
      startDate { year month day }
      endDate { year month day }
      nextAiringEpisode {
        episode
        airingAt
      }
      studios {
        edges {
          isMain
          node { id name }
        }
      }
      tags {
        id
        name
        description
        category
        rank
      }
      externalLinks {
        id
        site
        url
        type
        language
        color
        icon
      }
      trends {
        edges {
          node {
            date
            trending
            popularity
          }
        }
      }
    }
  }
}
GRAPHQL;

    /**
     * @return array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool}
     */
    public function fetchPage(
        int $page,
        int $perPage,
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        $payload = $this->requestPage(
            query: self::QUERY,
            variables: [
                'page' => $page,
                'perPage' => $perPage,
            ],
            page: $page,
            maxRateLimitRetries: $maxRateLimitRetries,
            maxServerErrorRetries: $maxServerErrorRetries,
            output: $output,
            rateLimitMessage: "AniList devolvio rate limit para la pagina {$page} y se agotaron los reintentos automaticos. Espera :retry_after segundos y vuelve a intentar.",
            rateLimitOutput: " ! AniList rate limit en la pagina {$page}. Esperando :retry_after s antes del reintento :attempt/:max...",
            allowPublicPageLimitAsEmpty: true,
            finalErrorMessage: "AniList devolvio un error para la pagina {$page}: :messages",
            invalidPageMessage: "AniList devolvio una respuesta sin pagina valida para la pagina {$page}.",
        );

        if ($payload === null) {
            if ($output !== null) {
                $output->writeln(
                    " ! Limite de API pública de AniList alcanzado en la pagina {$page}. Se han importado todos los animes disponibles."
                );
            }

            return [
                'media' => [],
                'current_page' => $page,
                'has_next_page' => false,
            ];
        }

        return $this->buildPageResult($payload, $page);
    }

    /**
     * @return array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool}
     */
    public function fetchPageByStartDateRange(
        int $page,
        int $perPage = 50,
        ?int $startDateGreater = null,
        ?int $startDateLesser = null,
        string $bucketLabel = 'sin rango',
        int $maxRateLimitRetries = 10,
        int $maxServerErrorRetries = 3,
        ?OutputStyle $output = null,
    ): array {
        $payload = $this->requestPage(
            query: self::QUERY_BY_START_DATE_RANGE,
            variables: [
                'page' => $page,
                'perPage' => $perPage,
                'startDateGreater' => $startDateGreater,
                'startDateLesser' => $startDateLesser,
            ],
            page: $page,
            maxRateLimitRetries: $maxRateLimitRetries,
            maxServerErrorRetries: $maxServerErrorRetries,
            output: $output,
            rateLimitMessage: "AniList devolvio rate limit en el rango {$bucketLabel}, pagina {$page}, y se agotaron los reintentos automaticos. Espera :retry_after segundos y vuelve a intentar.",
            rateLimitOutput: ' ! AniList rate limit. Esperando :retry_after s antes del reintento :attempt/:max...',
            allowPublicPageLimitAsEmpty: true,
            finalErrorMessage: "AniList devolvio un error para la pagina {$page}: :messages",
            invalidPageMessage: "AniList devolvio una respuesta sin pagina valida para la pagina {$page}.",
        );

        if ($payload === null) {
            throw new RuntimeException("AniList devolvio una respuesta vacia inesperada para el rango {$bucketLabel}, pagina {$page}.");
        }

        return $this->buildPageResult($payload, $page);
    }

    /**
     * @param  array<string, mixed>  $variables
     * @return array<string, mixed>|null
     */
    private function requestPage(
        string $query,
        array $variables,
        int $page,
        int $maxRateLimitRetries,
        int $maxServerErrorRetries,
        ?OutputStyle $output,
        string $rateLimitMessage,
        string $rateLimitOutput,
        bool $allowPublicPageLimitAsEmpty,
        string $finalErrorMessage,
        string $invalidPageMessage,
    ): ?array {
        $rateLimitAttempt = 0;
        $serverErrorAttempt = 0;
        $connectionAttempt = 0;

        while (true) {
            try {
                $response = Http::acceptJson()
                    ->timeout(30)
                    ->connectTimeout(10)
                    ->post(self::ENDPOINT, [
                        'query' => $query,
                        'variables' => $variables,
                    ]);
            } catch (ConnectionException $exception) {
                $connectionError = $this->handleConnectionError(
                    page: $page,
                    message: $exception->getMessage(),
                    attempt: $connectionAttempt,
                    maxRetries: $maxServerErrorRetries,
                    output: $output,
                );

                if ($connectionError !== null) {
                    throw new RuntimeException($connectionError['message'], previous: $exception);
                }

                continue;
            }

            if ($response->status() === 429) {
                $retryAfter = max(1, (int) $response->header('Retry-After', 60));

                if ($rateLimitAttempt >= $maxRateLimitRetries) {
                    throw new RuntimeException(str_replace(':retry_after', (string) $retryAfter, $rateLimitMessage));
                }

                $rateLimitAttempt++;

                if ($output !== null) {
                    $output->writeln(strtr($rateLimitOutput, [
                        ':retry_after' => (string) $retryAfter,
                        ':attempt' => (string) $rateLimitAttempt,
                        ':max' => (string) $maxRateLimitRetries,
                    ]));
                }

                Sleep::for($retryAfter)->seconds();

                continue;
            }

            $payload = $this->decodePayload($response);
            $errors = $this->extractErrors($payload);

            if ($response->serverError()) {
                $serverError = $this->handleServerError(
                    id: $page,
                    status: $response->status(),
                    messages: $this->extractErrorMessages($errors),
                    attempt: $serverErrorAttempt,
                    maxRetries: $maxServerErrorRetries,
                    output: $output,
                );

                if ($serverError !== null) {
                    throw new RuntimeException($serverError['message']);
                }

                continue;
            }

            if ($errors !== []) {
                if ($this->containsOnlyServerErrors($errors)) {
                    $serverError = $this->handleServerError(
                        id: $page,
                        status: $this->resolveGraphQlErrorStatus($errors),
                        messages: $this->extractErrorMessages($errors),
                        attempt: $serverErrorAttempt,
                        maxRetries: $maxServerErrorRetries,
                        output: $output,
                    );

                    if ($serverError !== null) {
                        throw new RuntimeException($serverError['message']);
                    }

                    continue;
                }

                $messages = $this->extractErrorMessages($errors);

                if ($allowPublicPageLimitAsEmpty && str_contains(strtolower($messages), 'page exceeds maximum')) {
                    return null;
                }

                throw new RuntimeException(str_replace(':messages', $messages, $finalErrorMessage));
            }

            $response->throw();

            $pagePayload = data_get($payload, 'data.Page');

            if (! is_array($pagePayload)) {
                throw new RuntimeException($invalidPageMessage);
            }

            return $pagePayload;
        }
    }

    /**
     * @param  array<string, mixed>  $pagePayload
     * @return array{media:list<array<string, mixed>>, current_page:int, has_next_page:bool}
     */
    private function buildPageResult(array $pagePayload, int $page): array
    {
        $media = collect(data_get($pagePayload, 'media', []))
            ->filter(fn (mixed $item): bool => is_array($item))
            ->values()
            ->all();

        return [
            'media' => $media,
            'current_page' => (int) data_get($pagePayload, 'pageInfo.currentPage', $page),
            'has_next_page' => (bool) data_get($pagePayload, 'pageInfo.hasNextPage', false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function decodePayload(Response $response): array
    {
        $payload = $response->json();

        return is_array($payload) ? $payload : [];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, array<string, mixed>>
     */
    private function extractErrors(array $payload): array
    {
        $errors = data_get($payload, 'errors', []);

        return is_array($errors) ? $errors : [];
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function containsOnlyServerErrors(array $errors): bool
    {
        return collect($errors)->every(function ($error): bool {
            $message = strtolower((string) ($error['message'] ?? ''));
            $status = (int) ($error['status'] ?? 0);

            return $status >= 500 || str_contains($message, 'internal server error');
        });
    }

    /**
     * @return array{message:string}|null
     */
    private function handleServerError(
        int $id,
        int $status,
        string $messages,
        int &$attempt,
        int $maxRetries,
        ?OutputStyle $output = null,
    ): ?array {
        $status = max(500, $status);
        $messages = $messages !== '' ? $messages : 'Internal Server Error';

        if ($attempt >= $maxRetries) {
            return [
                'message' => "AniList devolvio error {$status} para la pagina {$id} tras {$maxRetries} reintentos ({$messages})",
            ];
        }

        $attempt++;
        $waitSeconds = min(30, $attempt * 2);

        if ($output !== null) {
            $output->writeln(" ! AniList devolvio error {$status} en la pagina {$id}. Esperando {$waitSeconds}s antes del reintento {$attempt}/{$maxRetries}...");
        }

        Sleep::for($waitSeconds)->seconds();

        return null;
    }

    /**
     * @return array{message:string}|null
     */
    private function handleConnectionError(
        int $page,
        string $message,
        int &$attempt,
        int $maxRetries,
        ?OutputStyle $output = null,
    ): ?array {
        $message = $message !== '' ? $message : 'Connection error';

        if ($attempt >= $maxRetries) {
            return [
                'message' => "AniList no respondio por un error de conexion en la pagina {$page} tras {$maxRetries} reintentos ({$message})",
            ];
        }

        $attempt++;
        $waitSeconds = min(30, $attempt * 2);

        if ($output !== null) {
            $output->writeln(" ! AniList devolvio un error de conexion en la pagina {$page}. Esperando {$waitSeconds}s antes del reintento {$attempt}/{$maxRetries}...");
        }

        Sleep::for($waitSeconds)->seconds();

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function resolveGraphQlErrorStatus(array $errors): int
    {
        return (int) collect($errors)
            ->pluck('status')
            ->filter(fn ($status) => is_numeric($status))
            ->max();
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     */
    private function extractErrorMessages(array $errors): string
    {
        return collect($errors)
            ->pluck('message')
            ->filter()
            ->implode('; ');
    }
}
