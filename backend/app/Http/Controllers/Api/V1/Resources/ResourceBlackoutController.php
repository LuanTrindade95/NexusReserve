<?php

namespace App\Http\Controllers\Api\V1\Resources;

use App\Data\ResourceBlackoutData;
use App\Http\Controllers\Controller;
use App\Http\Requests\ResourceBlackouts\StoreResourceBlackoutRequest;
use App\Http\Resources\ResourceBlackoutResource;
use App\Models\Resource;
use App\Models\ResourceBlackout;
use App\Services\ResourceBlackoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ResourceBlackoutController extends Controller
{
    public function __construct(private readonly ResourceBlackoutService $blackouts) {}

    public function index(Resource $resource): AnonymousResourceCollection
    {
        return ResourceBlackoutResource::collection(
            $this->blackouts->listForResource($resource)
        );
    }

    public function store(StoreResourceBlackoutRequest $request, Resource $resource): JsonResponse
    {
        $blackout = $this->blackouts->create(
            $resource,
            ResourceBlackoutData::fromValidated($request->validated(), $resource->id)
        );

        return (new ResourceBlackoutResource($blackout))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Resource $resource, ResourceBlackout $blackout): Response
    {
        $this->blackouts->delete($resource, $blackout);

        return response()->noContent();
    }
}
