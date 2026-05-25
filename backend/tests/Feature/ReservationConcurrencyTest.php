<?php

use App\Data\ReservationData;
use App\Exceptions\ReservationConflictException;
use App\Models\Reservation;
use App\Models\Resource;
use App\Models\ResourceType;
use App\Models\User;
use App\Services\ReservationService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

function configureConcurrencyMysql(): void
{
    config([
        'database.default' => 'mysql',
        'database.connections.mysql.host' => env('CONCURRENCY_DB_HOST', 'mysql'),
        'database.connections.mysql.port' => env('CONCURRENCY_DB_PORT', '3306'),
        'database.connections.mysql.database' => env('CONCURRENCY_DB_DATABASE', 'nexus_reserve'),
        'database.connections.mysql.username' => env('CONCURRENCY_DB_USERNAME', 'nexus_reserve'),
        'database.connections.mysql.password' => env('CONCURRENCY_DB_PASSWORD', 'nexus_reserve'),
    ]);

    DB::purge('mysql');
    DB::reconnect('mysql');
}

it('allows only one concurrent creation for the same resource slot', function () {
    if (env('RUN_MYSQL_CONCURRENCY_TESTS') !== '1') {
        $this->markTestSkipped('Set RUN_MYSQL_CONCURRENCY_TESTS=1 to run the MySQL lock test.');
    }

    if (! function_exists('pcntl_fork')) {
        $this->markTestSkipped('pcntl is required for the concurrency test.');
    }

    configureConcurrencyMysql();
    Artisan::call('migrate:fresh', ['--database' => 'mysql']);
    $this->seed(RolesAndPermissionsSeeder::class);

    $resourceType = ResourceType::factory()->create([
        'requires_approval' => true,
        'max_duration_minutes' => 240,
    ]);
    $resource = Resource::factory()->for($resourceType)->create(['status' => 'active']);
    $users = User::factory()->count(2)->create();

    $runId = uniqid('reservation-lock-', true);
    $startFile = sys_get_temp_dir().DIRECTORY_SEPARATOR.$runId.'.start';
    $resultFiles = [
        sys_get_temp_dir().DIRECTORY_SEPARATOR.$runId.'.one.json',
        sys_get_temp_dir().DIRECTORY_SEPARATOR.$runId.'.two.json',
    ];
    $children = [];

    foreach ($users->values() as $index => $user) {
        $pid = pcntl_fork();

        if ($pid === -1) {
            $this->fail('Unable to fork concurrency worker.');
        }

        if ($pid === 0) {
            configureConcurrencyMysql();

            while (! file_exists($startFile)) {
                usleep(1000);
            }

            try {
                $reservation = app(ReservationService::class)->create(new ReservationData(
                    id: null,
                    resourceId: $resource->id,
                    userId: $user->id,
                    startsAt: '2026-06-20T09:00:00+00:00',
                    endsAt: '2026-06-20T10:00:00+00:00',
                    status: 'draft',
                    purpose: 'Concurrent reservation attempt',
                    approvedBy: null,
                    approvedAt: null,
                    rejectionReason: null,
                    cancelledAt: null,
                ));

                file_put_contents($resultFiles[$index], json_encode([
                    'ok' => true,
                    'reservation_id' => $reservation->id,
                    'status' => $reservation->status->getValue(),
                ]));
            } catch (Throwable $exception) {
                file_put_contents($resultFiles[$index], json_encode([
                    'ok' => false,
                    'class' => $exception::class,
                    'message' => $exception->getMessage(),
                ]));
            }

            exit(0);
        }

        $children[] = $pid;
    }

    touch($startFile);

    foreach ($children as $child) {
        pcntl_waitpid($child, $status);
    }

    $results = collect($resultFiles)
        ->map(fn (string $path) => json_decode((string) file_get_contents($path), true));

    foreach ([$startFile, ...$resultFiles] as $path) {
        if (file_exists($path)) {
            unlink($path);
        }
    }

    expect($results->where('ok', true))->toHaveCount(1)
        ->and($results->where('ok', false))->toHaveCount(1)
        ->and($results->where('ok', false)->first()['class'])->toBe(ReservationConflictException::class)
        ->and(Reservation::query()->where('resource_id', $resource->id)->where('status', 'pending')->count())->toBe(1);
});
