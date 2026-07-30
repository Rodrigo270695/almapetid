<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class ApiPeruConsultaException extends Exception
{
    public function __construct(
        string $message,
        private readonly int $status = 422,
        private readonly string $codeKey = 'api_error',
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, $status, $previous);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function codeKey(): string
    {
        return $this->codeKey;
    }

    public function toJsonResponse(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
            'code' => $this->codeKey,
        ], $this->status);
    }
}
