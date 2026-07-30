<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Carnet AlmaPet ID</title>
    <style>
        @page { margin: 0; }
        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            background: #fff;
        }
        table { border-collapse: collapse; }
        .outer {
            width: 242.65pt;
            border: 0.7pt solid #94a3b8;
        }
        .pad { padding: 6pt 6pt 4pt 7pt; }
        .logo { height: 13pt; }
        .icon { height: 13pt; width: 13pt; }
        .band td { height: 2.5pt; font-size: 1pt; line-height: 1pt; }
        .ba { width: 58%; }
        .bb { width: 26%; background: #dbeafe; }
        .bc { width: 16%; background: #ffedd5; }
        .lbl {
            font-size: 4.2pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3pt;
            line-height: 1;
            margin: 0;
            padding: 0;
        }
        .val {
            font-size: 6.2pt;
            font-weight: bold;
            text-transform: uppercase;
            line-height: 1.1;
            margin: 0 0 3pt 0;
            padding: 0;
        }
        .photo {
            width: 48pt;
            height: 58pt;
            border: 0.5pt solid #64748b;
        }
        .nophoto {
            width: 48pt;
            height: 58pt;
            border: 0.5pt solid #94a3b8;
            background: #f1f5f9;
            color: #94a3b8;
            font-size: 5pt;
            text-align: center;
        }
        .qr { width: 38pt; height: 38pt; }
        .code {
            font-size: 4pt;
            font-family: DejaVu Sans Mono, monospace;
            color: #475569;
            text-align: center;
            margin-top: 1.5pt;
        }
        .flag td { width: 3.5pt; height: 5pt; padding: 0; }
        .fr { background: #D91023; }
        .fw { background: #fff; border-top: 0.3pt solid #cbd5e1; border-bottom: 0.3pt solid #cbd5e1; }
        .foot {
            font-size: 3.8pt;
            color: #64748b;
            border-top: 0.4pt solid #e2e8f0;
            padding-top: 2pt;
            margin-top: 1pt;
        }
        .mono { font-family: DejaVu Sans Mono, monospace; }
        .stripe { width: 3.5pt; background: #f59e0b; }
    </style>
</head>
<body>
<table class="outer">
    <tr>
        <td class="pad" style="width:239pt; vertical-align:top;">
            <table style="width:100%;">
                <tr>
                    <td style="width:82%; vertical-align:middle;">
                        @if (!empty($logoDataUri))
                            <img class="logo" src="{{ $logoDataUri }}" alt="AlmaPet ID">
                        @else
                            <span style="font-size:9pt;font-weight:bold;color:#0369a1;">ALMAPET ID</span>
                        @endif
                    </td>
                    <td style="width:18%; text-align:right; vertical-align:middle;">
                        @if (!empty($iconDataUri))
                            <img class="icon" src="{{ $iconDataUri }}" alt="">
                        @endif
                    </td>
                </tr>
            </table>

            <table class="band" style="width:100%; margin:2pt 0 4pt 0;"><tr>
                <td class="ba">&nbsp;</td>
                <td class="bb">&nbsp;</td>
                <td class="bc">&nbsp;</td>
            </tr></table>

            <table style="width:100%;">
                <tr>
                    <td style="width:27%; padding-right:3pt; vertical-align:top;">
                        <p class="lbl">Nombre</p>
                        <p class="val">{{ $animal?->name ?? '—' }}</p>
                        <p class="lbl">Raza</p>
                        <p class="val">{{ $animal?->breed ?: ($animal?->species ?? '—') }}</p>
                        <p class="lbl">Sexo</p>
                        <p class="val">{{ $sexLabel }}</p>
                        <p class="lbl">Fecha de registro</p>
                        <p class="val">{{ $issuedAt->format('Y-m-d') }}</p>
                    </td>
                    <td style="width:30%; padding-right:3pt; vertical-align:top;">
                        <p class="lbl">Apellido</p>
                        <p class="val">{{ $owner?->lastname ?: '—' }}</p>
                        <p class="lbl">Fecha de nacimiento</p>
                        <p class="val">{{ $animal?->birth_date?->format('Y-m-d') ?? '—' }}</p>
                        <p class="lbl">Nacionalidad</p>
                        <p class="val" style="margin-bottom:1pt;">{{ $nationality }}</p>
                        <table style="margin-bottom:3pt;"><tr>
                            <td><table class="flag"><tr>
                                <td class="fr"></td><td class="fw"></td><td class="fr"></td>
                            </tr></table></td>
                        </tr></table>
                        <p class="lbl">Fecha de vencimiento</p>
                        <p class="val">{{ $expiresAt->format('Y-m-d') }}</p>
                    </td>
                    <td style="width:22%; text-align:center; vertical-align:top;">
                        @if (!empty($photoDataUri))
                            <img class="photo" src="{{ $photoDataUri }}" alt="Foto">
                        @else
                            <div class="nophoto"><br><br>SIN FOTO</div>
                        @endif
                    </td>
                    <td style="width:21%; text-align:center; vertical-align:middle;">
                        @if (!empty($qrPng))
                            <img class="qr" src="{{ $qrPng }}" alt="QR">
                        @endif
                        <div class="code">{{ $chip->public_code }}</div>
                        <div class="code" style="margin-top:2pt;">{{ $chip->certificate_code }}</div>
                    </td>
                </tr>
            </table>

            <div class="foot">
                Microchip <span class="mono">{{ $chip->microchip }}</span>
                · Vigencia 3 años
                · {{ $organization?->name ?? 'AlmaPet ID' }}
                · Formato DNI Perú 85,60 × 53,98 mm
            </div>
        </td>
        <td class="stripe">&nbsp;</td>
    </tr>
</table>
</body>
</html>
