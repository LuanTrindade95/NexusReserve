<?php

namespace App\Http\Requests\Reservations;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexReservationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'resource_id' => ['sometimes', 'integer', Rule::exists('resources', 'id')],
            'mine' => ['sometimes', 'boolean'],
            'user_id' => ['sometimes', 'integer', Rule::exists('users', 'id')],
            'status' => ['sometimes', 'string', Rule::in([
                'draft',
                'pending',
                'approved',
                'rejected',
                'checked_out',
                'returned',
                'cancelled',
            ])],
            'starts_from' => ['sometimes', 'date'],
            'ends_until' => ['sometimes', 'date'],
            'search' => ['sometimes', 'string', 'max:120'],
            'sort' => ['sometimes', 'string', Rule::in(['starts_at', 'ends_at', 'status', 'created_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
