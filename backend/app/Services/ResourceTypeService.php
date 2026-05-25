<?php

namespace App\Services;

use App\Data\ResourceTypeData;
use App\Models\ResourceType;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ResourceTypeService
{
    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, ResourceType>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $query = ResourceType::query();

        if (isset($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (array_key_exists('requires_approval', $filters)) {
            $query->where('requires_approval', (bool) $filters['requires_approval']);
        }

        $sort = $filters['sort'] ?? 'name';
        $direction = $filters['direction'] ?? 'asc';
        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(ResourceTypeData $data): ResourceType
    {
        return ResourceType::create($data->toModelAttributes());
    }

    public function update(ResourceType $resourceType, ResourceTypeData $data): ResourceType
    {
        $resourceType->update($data->toModelAttributes());

        return $resourceType->refresh();
    }

    public function delete(ResourceType $resourceType): void
    {
        $resourceType->delete();
    }
}
