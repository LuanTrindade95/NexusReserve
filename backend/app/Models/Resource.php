<?php

namespace App\Models;

use Database\Factories\ResourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;

class Resource extends Model implements Auditable
{
    /** @use HasFactory<ResourceFactory> */
    use HasFactory;
    use \OwenIt\Auditing\Auditable;
    use SoftDeletes;

    protected $fillable = [
        'resource_type_id',
        'name',
        'code',
        'description',
        'location',
        'capacity',
        'status',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function resourceType(): BelongsTo
    {
        return $this->belongsTo(ResourceType::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function blackouts(): HasMany
    {
        return $this->hasMany(ResourceBlackout::class);
    }
}
