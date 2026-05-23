<?php

namespace App\Services;

use App\Data\ResourceBlackoutData;
use App\Models\Resource;
use App\Models\ResourceBlackout;
use Illuminate\Database\Eloquent\Collection;

class ResourceBlackoutService
{
    /**
     * @return Collection<int, ResourceBlackout>
     */
    public function listForResource(Resource $resource): Collection
    {
        return $resource
            ->blackouts()
            ->orderBy('starts_at')
            ->get();
    }

    public function create(Resource $resource, ResourceBlackoutData $data): ResourceBlackout
    {
        return $resource->blackouts()->create($data->toModelAttributes());
    }

    public function delete(Resource $resource, ResourceBlackout $blackout): void
    {
        abort_unless($blackout->resource_id === $resource->id, 404);

        $blackout->delete();
    }
}
