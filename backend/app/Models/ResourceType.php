<?php

namespace App\Models;

use Database\Factories\ResourceTypeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ResourceType extends Model
{
    /** @use HasFactory<ResourceTypeFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'requires_approval',
        'max_duration_minutes',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'requires_approval' => 'boolean',
            'max_duration_minutes' => 'integer',
        ];
    }

    public function resources(): HasMany
    {
        return $this->hasMany(Resource::class);
    }
}
