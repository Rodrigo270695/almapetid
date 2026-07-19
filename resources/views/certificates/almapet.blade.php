<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Certificado AlmaPet ID — {{ $chip->certificate_code }}</title>
    <style>
        @page { margin: 28px 32px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0A1A24;
            font-size: 12px;
            line-height: 1.45;
        }
        .frame {
            border: 2px solid #0E7490;
            padding: 28px 32px;
            min-height: 960px;
        }
        .brand {
            font-size: 22px;
            font-weight: bold;
            letter-spacing: 0.04em;
            color: #0E7490;
            margin: 0;
        }
        .eyebrow {
            margin: 4px 0 0;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
        }
        h1 {
            margin: 28px 0 8px;
            font-size: 26px;
            font-weight: bold;
        }
        .sub {
            color: #475569;
            margin: 0 0 24px;
            font-size: 12px;
        }
        .grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .grid td {
            vertical-align: top;
            padding: 0;
        }
        .label {
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: #64748b;
            margin: 0 0 2px;
        }
        .value {
            font-size: 13px;
            font-weight: bold;
            margin: 0 0 14px;
        }
        .qr-box {
            text-align: center;
            border: 1px solid #e2e8f0;
            padding: 12px;
            width: 160px;
        }
        .qr-box img { width: 140px; height: 140px; }
        .qr-caption {
            margin-top: 8px;
            font-size: 9px;
            color: #64748b;
            word-break: break-all;
        }
        .note {
            margin-top: 36px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            font-size: 10px;
            color: #64748b;
        }
        .footer {
            margin-top: 28px;
            font-size: 10px;
            color: #94a3b8;
        }
        .badge {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 10px;
            border-radius: 999px;
            background: #ecfeff;
            color: #0e7490;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
    </style>
</head>
<body>
<div class="frame">
    <p class="brand">AlmaPet ID</p>
    <p class="eyebrow">Red de identidad animal · Perú</p>

    <h1>Certificado de registro</h1>
    <p class="sub">
        Este documento acredita el registro del microchip en la red AlmaPet ID.
        El microchip identifica; AlmaPet conecta dueño, clínica y quien encuentra.
    </p>

    <table class="grid">
        <tr>
            <td style="width: 62%; padding-right: 24px;">
                <p class="label">Mascota</p>
                <p class="value">{{ $animal?->name }}</p>

                <p class="label">Especie / raza</p>
                <p class="value">
                    {{ collect([$animal?->species, $animal?->breed])->filter()->implode(' · ') ?: '—' }}
                </p>

                <p class="label">Microchip</p>
                <p class="value">{{ $chip->microchip }}</p>

                <p class="label">Código AlmaPet</p>
                <p class="value">{{ $chip->public_code }}</p>

                <p class="label">Certificado</p>
                <p class="value">{{ $chip->certificate_code }}</p>

                <p class="label">Tutor</p>
                <p class="value">
                    {{ trim(($owner?->name ?? '').' '.($owner?->lastname ?? '')) ?: '—' }}
                </p>

                <p class="label">Clínica registradora</p>
                <p class="value">{{ $organization?->name ?: 'Registro directo AlmaPet' }}</p>

                <p class="label">Registrado</p>
                <p class="value">
                    {{ optional($chip->registered_at)?->timezone('America/Lima')->format('d/m/Y H:i') ?: '—' }}
                </p>

                <span class="badge">{{ strtoupper((string) $chip->status) }}</span>
            </td>
            <td style="width: 38%;">
                <div class="qr-box">
                    <img src="{{ $qrPng }}" alt="QR perfil público">
                    <div class="qr-caption">
                        Escanea para ver el perfil público<br>
                        {{ $profileUrl }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="note">
        No incluye el chip físico ni la implantación. No es GPS.
        La búsqueda y el reencuentro se hacen en la red AlmaPet ID sin exponer el teléfono del tutor.
    </div>

    <div class="footer">
        Emitido {{ $issuedAt->format('d/m/Y H:i') }} (hora Perú) · {{ config('app.url') }}
    </div>
</div>
</body>
</html>
