<?php

namespace App\Exceptions;

use RuntimeException;

class ReservationConflictException extends RuntimeException
{
    /**
     * @param  array<string, mixed>  $errors
     */
    public function __construct(
        string $message,
        private readonly array $errors = [],
    ) {
        parent::__construct($message);
    }

    /**
     * @return array<string, mixed>
     */
    public function errors(): array
    {
        return $this->errors;
    }
}
