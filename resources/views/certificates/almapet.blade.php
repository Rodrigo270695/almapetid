<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Carnet AlmaPet ID — {{ $chip->certificate_code }}</title>
    <style>
        @page { margin: 18mm 12mm; size: A4 landscape; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 11px;
            margin: 0;
        }
        .card {
            position: relative;
            width: 100%;
            max-width: 860px;
            margin: 0 auto;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            overflow: hidden;
            background: #fff;
            min-height: 320px;
        }
        .accent {
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 10px;
            background: #f59e0b;
        }
        .wave {
            position: absolute;
            left: 28%;
            top: 0;
            bottom: 0;
            width: 42%;
            background: #e0f2fe;
            opacity: 0.55;
            transform: skewX(-12deg);
        }
        .inner {
            position: relative;
            z-index: 2;
            padding: 22px 28px 18px;
        }
        .header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .brand {
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.12em;
            color: #0369a1;
            text-transform: uppercase;
        }
        .brand-sub {
            font-size: 9px;
            color: #64748b;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }
        .logo-right {
            text-align: right;
            font-size: 14px;
            font-weight: bold;
            color: #0e7490;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
        }
        .grid td { vertical-align: top; }
        .label {
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #64748b;
            margin: 0 0 2px;
        }
        .value {
            font-size: 13px;
            font-weight: bold;
            margin: 0 0 12px;
            text-transform: uppercase;
        }
        .photo-wrap {
            width: 132px;
            text-align: center;
        }
        .photo {
            width: 120px;
            height: 140px;
            object-fit: cover;
            border: 1px solid #94a3b8;
            background: #f8fafc;
        }
        .photo-ph {
            width: 120px;
            height: 140px;
            border: 1px solid #94a3b8;
            background: #f1f5f9;
            line-height: 140px;
            color: #94a3b8;
            font-size: 10px;
        }
        .code-vert {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            font-size: 9px;
            letter-spacing: 0.08em;
            color: #334155;
            font-family: DejaVu Sans Mono, monospace;
        }
        .footer {
            margin-top: 8px;
            font-size: 8px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
        .qr {
            width: 72px;
            height: 72px;
        }
    </style>
</head>
<body>
@php
    $animal = $chip->animal;
    $owner = $animal?->owner;
    $org = $chip->organization;
    $sexLabel = match (strtoupper((string) ($animal?->sex ?? ''))) {
        'M' => 'MACHO',
        'H', 'F' => 'HEMBRA',
        default => '—',
    };
    $photoUrl = $animal?->photoUrl();
@endphp
<div class="card">
    <div class="wave"></div>
    <div class="accent"></div>
    <div class="inner">
        <table class="header">
            <tr>
                <td>
                    <div class="brand">AlmaPet ID</div>
                    <div class="brand-sub">Registro de identidad animal</div>
                </td>
                <td class="logo-right">CARNET DIGITAL</td>
            </tr>
        </table>

        <table class="grid">
            <tr>
                <td style="width: 58%; padding-right: 16px;">
                    <p class="label">Nombre</p>
                    <p class="value">{{ $animal?->name ?? '—' }}</p>

                    <p class="label">Apellido / Titular</p>
                    <p class="value">{{ $owner?->lastname ?: ($owner?->fullName() ?? '—') }}</p>

                    <p class="label">Raza</p>
                    <p class="value">{{ $animal?->breed ?: ($animal?->species ?? '—') }}</p>

                    <p class="label">Sexo</p>
                    <p class="value">{{ $sexLabel }}</p>

                    <p class="label">Fecha de nacimiento</p>
                    <p class="value">{{ $animal?->birth_date?->format('Y-m-d') ?? '—' }}</p>

                    <p class="label">Nacionalidad</p>
                    <p class="value">{{ strtoupper((string) ($chip->country_code ?: 'PE')) }}</p>

                    <p class="label">Clínica registradora</p>
                    <p class="value" style="font-size:11px;">{{ $org?->name ?? '—' }}</p>

                    <p class="label">Microchip</p>
                    <p class="value" style="font-family: DejaVu Sans Mono, monospace; font-size:11px;">{{ $chip->microchip }}</p>
                </td>
                <td style="width: 28%; text-align: center;">
                    <div class="photo-wrap">
                        @if ($photoUrl)
                            <img class="photo" src="{{ $photoUrl }}" alt="Foto">
                        @else
                            <div class="photo-ph">SIN FOTO</div>
                        @endif
                    </div>
                    <div style="margin-top: 10px;">
                        @if (!empty($qrPng))
                            <img class="qr" src="{{ $qrPng }}" alt="QR">
                        @endif
                    </div>
                    <div style="margin-top: 6px; font-size: 8px; color: #64748b;">
                        {{ $chip->public_code }}
                    </div>
                </td>
                <td style="width: 14%; text-align: center;">
                    <div class="code-vert">{{ $chip->certificate_code }}</div>
                </td>
            </tr>
        </table>

        <div class="footer">
            Activado: {{ $chip->registered_at?->format('Y-m-d') ?? '—' }}
            · Certificado {{ $chip->certificate_code }}
            · Este documento acredita el registro digital en AlmaPet ID (no incluye el microchip físico).
        </div>
    </div>
</div>
</body>
</html>
