<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Carnet AlmaPet ID — {{ $chip->certificate_code }}</title>
    <style>
        /* ISO/IEC 7810 ID-1 = DNI Perú: 85,60 × 53,98 mm (imprenta física) */
        @page {
            margin: 0;
            size: 85.60mm 53.98mm;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
            width: 85.60mm;
            height: 53.98mm;
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            background: #fff;
        }
        .card {
            position: relative;
            width: 85.60mm;
            height: 53.98mm;
            overflow: hidden;
            background: #ffffff;
        }
        .bg-a {
            position: absolute;
            left: 36%;
            top: -10mm;
            width: 34mm;
            height: 72mm;
            background: #dbeafe;
            opacity: 0.5;
            transform: skewX(-16deg);
        }
        .bg-b {
            position: absolute;
            left: 50%;
            top: -6mm;
            width: 20mm;
            height: 72mm;
            background: #ffedd5;
            opacity: 0.42;
            transform: skewX(-16deg);
        }
        .stripe {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 1.6mm;
            background: #f59e0b;
        }
        .inner {
            position: relative;
            z-index: 2;
            padding: 2mm 3.2mm 1.6mm 2.6mm;
            height: 100%;
        }
        .header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.2mm;
        }
        .header td { vertical-align: middle; }
        .logo {
            height: 5.2mm;
            max-width: 44mm;
        }
        .brand-fallback {
            font-size: 8pt;
            font-weight: bold;
            color: #0369a1;
            letter-spacing: 0.04em;
        }
        .header-right {
            text-align: right;
            width: 18mm;
        }
        .icon {
            height: 5.2mm;
            width: 5.2mm;
        }
        .main {
            width: 100%;
            border-collapse: collapse;
        }
        .main td { vertical-align: top; }
        .col-l { width: 27%; padding-right: 1.2mm; }
        .col-m { width: 30%; padding-right: 1.2mm; }
        .col-p { width: 27%; text-align: center; }
        .col-v { width: 12%; text-align: center; padding-left: 0.6mm; }
        .label {
            font-size: 4pt;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #64748b;
            line-height: 1.05;
            margin-bottom: 0.15mm;
        }
        .value {
            font-size: 6pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            line-height: 1.12;
            margin-bottom: 1.35mm;
            word-wrap: break-word;
        }
        .photo {
            width: 17.5mm;
            height: 21mm;
            object-fit: cover;
            border: 0.22mm solid #64748b;
            background: #f1f5f9;
        }
        .photo-ph {
            width: 17.5mm;
            height: 21mm;
            border: 0.22mm solid #94a3b8;
            background: #f1f5f9;
            color: #94a3b8;
            font-size: 4pt;
            text-align: center;
            padding-top: 8mm;
            margin: 0 auto;
        }
        .qr {
            width: 9.5mm;
            height: 9.5mm;
            margin-top: 1mm;
        }
        .pub {
            margin-top: 0.5mm;
            font-size: 3.8pt;
            color: #475569;
            font-family: DejaVu Sans Mono, monospace;
            letter-spacing: 0.02em;
        }
        .barcode {
            width: 4.2mm;
            margin: 0 auto 1mm;
            border-collapse: collapse;
        }
        .barcode td {
            height: 22mm;
            padding: 0;
            vertical-align: top;
        }
        .bar-1 { width: 0.35mm; background: #0f172a; }
        .bar-2 { width: 0.7mm; background: #0f172a; }
        .bar-0 { width: 0.35mm; background: #fff; }
        .vert-code {
            font-size: 4pt;
            font-family: DejaVu Sans Mono, monospace;
            color: #334155;
            letter-spacing: 0.06em;
            line-height: 1.05;
            text-align: center;
        }
        .vert-code span {
            display: block;
        }
        .nat-wrap {
            margin-bottom: 1.35mm;
        }
        .nat-value {
            font-size: 6pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            line-height: 1.2;
        }
        .flag {
            display: inline-block;
            vertical-align: middle;
            border: 0.12mm solid #cbd5e1;
            margin-right: 0.7mm;
        }
        .flag td {
            width: 1.5mm;
            height: 2.2mm;
            padding: 0;
        }
        .flag-red { background: #D91023; }
        .flag-white { background: #ffffff; }
        .icons-row {
            margin-top: 0.4mm;
            line-height: 1;
        }
        .paw {
            display: inline-block;
            position: relative;
            width: 3.4mm;
            height: 3.4mm;
            vertical-align: middle;
            margin-left: 0.8mm;
        }
        .paw-pad {
            position: absolute;
            left: 0.85mm;
            top: 1.5mm;
            width: 1.7mm;
            height: 1.5mm;
            background: #64748b;
            border-radius: 0.7mm 0.7mm 0.9mm 0.9mm;
        }
        .paw-toe {
            position: absolute;
            width: 0.85mm;
            height: 1.05mm;
            background: #64748b;
            border-radius: 50%;
        }
        .paw-toe.t1 { left: 0.15mm; top: 0.55mm; }
        .paw-toe.t2 { left: 0.95mm; top: 0.1mm; }
        .paw-toe.t3 { left: 1.75mm; top: 0.1mm; }
        .paw-toe.t4 { left: 2.45mm; top: 0.55mm; }
        .foot {
            position: absolute;
            left: 2.6mm;
            right: 3.4mm;
            bottom: 1.2mm;
            z-index: 3;
            font-size: 3.5pt;
            color: #64748b;
            border-top: 0.18mm solid #e2e8f0;
            padding-top: 0.7mm;
        }
        .mono {
            font-family: DejaVu Sans Mono, monospace;
            letter-spacing: 0.02em;
        }
    </style>
</head>
<body>
@php
    /** @var \Carbon\CarbonInterface $issuedAt */
    /** @var \Carbon\CarbonInterface $expiresAt */
    $certChars = str_split((string) $chip->certificate_code);
    $bars = '';
    $seed = preg_replace('/\D+/', '', (string) $chip->microchip) ?: (string) $chip->certificate_code;
    for ($i = 0; $i < 18; $i++) {
        $d = (int) ($seed[$i % max(1, strlen($seed))] ?? 0);
        $bars .= $d % 3 === 0 ? '2' : ($d % 2 === 0 ? '1' : '0');
    }
@endphp
<div class="card">
    <div class="bg-a"></div>
    <div class="bg-b"></div>
    <div class="stripe"></div>

    <div class="inner">
        <table class="header">
            <tr>
                <td>
                    @if (!empty($logoDataUri))
                        <img class="logo" src="{{ $logoDataUri }}" alt="AlmaPet ID">
                    @else
                        <span class="brand-fallback">ALMAPET ID</span>
                    @endif
                </td>
                <td class="header-right">
                    @if (!empty($iconDataUri))
                        <img class="icon" src="{{ $iconDataUri }}" alt="">
                    @endif
                </td>
            </tr>
        </table>

        <table class="main">
            <tr>
                <td class="col-l">
                    <div class="label">Nombre</div>
                    <div class="value">{{ $animal?->name ?? '—' }}</div>

                    <div class="label">Raza</div>
                    <div class="value">{{ $animal?->breed ?: ($animal?->species ?? '—') }}</div>

                    <div class="label">Sexo</div>
                    <div class="value">{{ $sexLabel }}</div>

                    <div class="label">Fecha de registro</div>
                    <div class="value">{{ $issuedAt->format('Y-m-d') }}</div>
                </td>
                <td class="col-m">
                    <div class="label">Apellido</div>
                    <div class="value">{{ $owner?->lastname ?: '—' }}</div>

                    <div class="label">Fecha de nacimiento</div>
                    <div class="value">{{ $animal?->birth_date?->format('Y-m-d') ?? '—' }}</div>

                    <div class="label">Nacionalidad</div>
                    <div class="nat-wrap">
                        <div class="nat-value">{{ $nationality }}</div>
                        <div class="icons-row">
                            <table class="flag" cellpadding="0" cellspacing="0" style="display:inline-table;vertical-align:middle;"><tr>
                                <td class="flag-red"></td>
                                <td class="flag-white"></td>
                                <td class="flag-red"></td>
                            </tr></table>
                            <span class="paw" title="AlmaPet">
                                <span class="paw-pad"></span>
                                <span class="paw-toe t1"></span>
                                <span class="paw-toe t2"></span>
                                <span class="paw-toe t3"></span>
                                <span class="paw-toe t4"></span>
                            </span>
                        </div>
                    </div>

                    <div class="label">Fecha de vencimiento</div>
                    <div class="value">{{ $expiresAt->format('Y-m-d') }}</div>
                </td>
                <td class="col-p">
                    @if (!empty($photoDataUri))
                        <img class="photo" src="{{ $photoDataUri }}" alt="Foto">
                    @else
                        <div class="photo-ph">SIN FOTO</div>
                    @endif
                    @if (!empty($qrPng))
                        <img class="qr" src="{{ $qrPng }}" alt="QR">
                    @endif
                    <div class="pub">{{ $chip->public_code }}</div>
                </td>
                <td class="col-v">
                    <table class="barcode" cellpadding="0" cellspacing="0"><tr>
                        @foreach (str_split($bars) as $b)
                            <td class="bar-{{ $b }}"></td>
                        @endforeach
                    </tr></table>
                    <div class="vert-code">
                        @foreach ($certChars as $ch)
                            <span>{{ $ch }}</span>
                        @endforeach
                    </div>
                </td>
            </tr>
        </table>

        <div class="foot">
            Microchip <span class="mono">{{ $chip->microchip }}</span>
            · Vigencia 3 años
            · {{ $organization?->name ?? 'AlmaPet ID' }}
            · Formato DNI Perú 85,60×53,98 mm
        </div>
    </div>
</div>
</body>
</html>
