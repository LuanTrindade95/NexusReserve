<?php

namespace App\Models;

use App\States\Reservations\ReservationStatus;
use Database\Factories\ReservationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use OwenIt\Auditing\Contracts\Auditable;
use Spatie\ModelStates\HasStates;

class Reservation extends Model implements Auditable
{
    /** @use HasFactory<ReservationFactory> */
    use HasFactory;

    use HasStates;
    use \OwenIt\Auditing\Auditable;
    use SoftDeletes;

    protected $fillable = [
        'resource_id',
        'user_id',
        'starts_at',
        'ends_at',
        'status',
        'purpose',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'approved_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'status' => ReservationStatus::class,
        ];
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(ReservationStatusLog::class);
    }
}
