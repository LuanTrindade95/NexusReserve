<?php

namespace App\Http\Requests\Resources;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexResourcesRequest extends FormRequest
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
            'type' => ['sometimes', 'string', 'max:120'],
            'status' => ['sometimes', 'string', Rule::in(['active', 'maintenance', 'retired'])],
            'location' => ['sometimes', 'string', 'max:120'],
            'search' => ['sometimes', 'string', 'max:120'],
            'sort' => ['sometimes', 'string', Rule::in(['name', 'code', 'status', 'location', 'created_at'])],
            'direction' => ['sometimes', 'string', Rule::in(['asc', 'desc'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
