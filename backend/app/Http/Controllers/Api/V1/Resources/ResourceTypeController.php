<?php

namespace App\Http\Controllers\Api\V1\Resources;

use App\Data\ResourceTypeData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceTypes\IndexResourceTypesRequest;
use App\Http\Requests\ResourceTypes\StoreResourceTypeRequest;
use App\Http\Requests\ResourceTypes\UpdateResourceTypeRequest;
use App\Http\Resources\ResourceTypeResource;
use App\Models\ResourceType;
use App\Services\ResourceTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ResourceTypeController extends Controller
{
    public function __construct(private readonly ResourceTypeService $resourceTypes) {}

    public function index(IndexResourceTypesRequest $request): AnonymousResourceCollection
    {
        return ResourceTypeResource::collection(
            $this->resourceTypes->paginate($request->validated())
        );
    }

    public function store(StoreResourceTypeRequest $request): JsonResponse
    {
        $resourceType = $this->resourceTypes->create(
            ResourceTypeData::fromValidated($request->validated())
        );

        return (new ResourceTypeResource($resourceType))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ResourceType $resourceType): ResourceTypeResource
    {
        return new ResourceTypeResource($resourceType);
    }

    public function update(UpdateResourceTypeRequest $request, ResourceType $resourceType): ResourceTypeResource
    {
        $resourceType = $this->resourceTypes->update(
            $resourceType,
            ResourceTypeData::fromValidated($request->validated(), $resourceType)
        );

        return new ResourceTypeResource($resourceType);
    }

    public function destroy(ResourceType $resourceType): Response
    {
        $this->resourceTypes->delete($resourceType);

        return response()->noContent();
    }
}
