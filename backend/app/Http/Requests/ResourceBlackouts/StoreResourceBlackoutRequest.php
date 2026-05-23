<?php

namespace App\Http\Requests\ResourceBlackouts;

use Illuminate\Foundation\Http\FormRequest;

class StoreResourceBlackoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('resources.manage') ?? false;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'reason' => ['required', 'string', 'max:255'],
        ];
    }
}
