<?php

namespace App\Http\Requests\Reservations;

use Illuminate\Foundation\Http\FormRequest;

class RejectReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reservations.approve') ?? false;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:1000'],
        ];
    }
}
