<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Certificates\CertificatePdfService;
use Symfony\Component\HttpFoundation\Response;

class CertificateController extends Controller
{
    public function __invoke(string $code, CertificatePdfService $certificates): Response
    {
        $chip = $certificates->findByCode($code);

        abort_if($chip === null, 404);

        return $certificates->download($chip);
    }
}
