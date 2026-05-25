<?php

namespace App\Http\Requests\Resources;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('resources.manage') ?? false;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'resource_type_id' => ['required', 'integer', Rule::exists('resource_types', 'id')],
            'name' => ['required', 'string', 'max:160'],
            'code' => ['required', 'string', 'alpha_dash', 'max:80', Rule::unique('resources', 'code')],
            'description' => ['nullable', 'string', 'max:2000'],
            'location' => ['required', 'string', 'max:160'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:500'],
            'status' => ['required', 'string', Rule::in(['active', 'maintenance', 'retired'])],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
