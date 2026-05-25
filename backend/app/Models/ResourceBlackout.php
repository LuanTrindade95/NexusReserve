<?php

namespace App\Models;

use Database\Factories\ResourceBlackoutFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceBlackout extends Model
{
    /** @use HasFactory<ResourceBlackoutFactory> */
    use HasFactory;

    protected $fillable = [
        'resource_id',
        'starts_at',
        'ends_at',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
