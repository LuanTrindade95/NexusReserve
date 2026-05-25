<?php

namespace App\Services;

use App\Data\ResourceData;
use App\Models\Resource;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ResourceService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, resource>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = Resource::query()->with('resourceType');

        if (isset($filters['type'])) {
            $type = $filters['type'];

            $query->whereHas('resourceType', function ($query) use ($type) {
                $query
                    ->where('id', $type)
                    ->orWhere('slug', $type);
            });
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['location'])) {
            $query->where('location', 'like', "%{$filters['location']}%");
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(ResourceData $data): Resource
    {
        return Resource::create($data->toModelAttributes())->load('resourceType');
    }

    public function update(Resource $resource, ResourceData $data): Resource
    {
        $resource->update($data->toModelAttributes());

        return $resource->refresh()->load('resourceType');
    }

    public function delete(Resource $resource): void
    {
        $resource->delete();
    }

    public function restore(int $resourceId): Resource
    {
        $resource = Resource::withTrashed()->findOrFail($resourceId);
        $resource->restore();

        return $resource->refresh()->load('resourceType');
    }
}
