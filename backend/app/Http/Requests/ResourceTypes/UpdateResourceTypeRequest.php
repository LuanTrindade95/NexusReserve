<?php

namespace App\Http\Requests\ResourceTypes;

use App\Models\ResourceType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResourceTypeRequest extends FormRequest
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
        /** @var ResourceType $resourceType */
        $resourceType = $this->route('resource_type');

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required',
                'string',
                'alpha_dash',
                'max:120',
                Rule::unique('resource_types', 'slug')->ignore($resourceType),
            ],
            'icon' => ['nullable', 'string', 'max:80'],
            'requires_approval' => ['required', 'boolean'],
            'max_duration_minutes' => ['nullable', 'integer', 'min:15', 'max:43200'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
