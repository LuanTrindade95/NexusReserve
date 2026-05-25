<?php

namespace App\Http\Controllers\Api\V1\Resources;

use App\Data\ResourceData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Resources\IndexResourcesRequest;
use App\Http\Requests\Resources\StoreResourceRequest;
use App\Http\Requests\Resources\UpdateResourceRequest;
use App\Http\Resources\AuditResource;
use App\Http\Resources\ResourceResource;
use App\Models\Resource;
use App\Services\ResourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ResourceController extends Controller
{
    public function __construct(private readonly ResourceService $resources) {}

    public function index(IndexResourcesRequest $request): AnonymousResourceCollection
    {
        return ResourceResource::collection(
            $this->resources->paginate($request->validated())
        );
    }

    public function store(StoreResourceRequest $request): JsonResponse
    {
        $resource = $this->resources->create(
            ResourceData::fromValidated($request->validated())
        );

        return (new ResourceResource($resource))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Resource $resource): ResourceResource
    {
        return new ResourceResource($resource->load('resourceType'));
    }

    public function update(UpdateResourceRequest $request, Resource $resource): ResourceResource
    {
        $resource = $this->resources->update(
            $resource,
            ResourceData::fromValidated($request->validated(), $resource)
        );

        return new ResourceResource($resource);
    }

    public function destroy(Resource $resource): Response
    {
        $this->resources->delete($resource);

        return response()->noContent();
    }

    public function restore(int $resource): ResourceResource
    {
        return new ResourceResource($this->resources->restore($resource));
    }

    public function audits(Resource $resource): AnonymousResourceCollection
    {
        return AuditResource::collection(
            $resource->audits()->latest()->paginate(15)
        );
    }
}
