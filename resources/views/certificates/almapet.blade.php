<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: DejaVu Sans, sans-serif; color: #0f172a; }
        table { border-collapse: collapse; }
        .card {
            width: 240pt;
            background: #e7f3f9;
            border: 0.7pt solid #64748b;
        }
        .pad { padding: 4pt 5pt 3pt 5pt; }
        .brand { font-size: 8pt; font-weight: bold; color: #0e7490; letter-spacing: 0.35pt; }
        .sub { font-size: 3.3pt; color: #475569; text-transform: uppercase; letter-spacing: 0.15pt; }
        .cui { font-size: 4pt; color: #334155; text-align: right; }
        .cui b { font-size: 5.5pt; font-family: DejaVu Sans Mono, monospace; }
        .lbl { font-size: 3.3pt; color: #0369a1; text-transform: uppercase; }
        .val { font-size: 5.8pt; font-weight: bold; text-transform: uppercase; }
        .cad { font-size: 5.6pt; font-weight: bold; color: #b91c1c; }
        .foot { font-size: 3pt; color: #475569; border-top: 0.35pt solid #94a3b8; padding-top: 1.5pt; margin-top: 2pt; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
        .bar { height: 1.8pt; background: #0e7490; margin: 2pt 0; font-size: 1pt; line-height: 1pt; }
        .back {
            page-break-before: always;
            width: 240pt;
            background: #0e7490;
            border: 0.7pt solid #155e75;
        }
        .back-inner {
            color: #ffffff;
            text-align: center;
            padding: 32pt 10pt;
        }
        .btitle { font-size: 14pt; font-weight: bold; letter-spacing: 1pt; color: #ffffff; }
        .bsub { font-size: 4.8pt; color: #cffafe; letter-spacing: 0.5pt; text-transform: uppercase; margin-top: 4pt; }
        .bcode { font-size: 4.2pt; font-family: DejaVu Sans Mono, monospace; color: #e0f2fe; margin-top: 8pt; }
        .pc { font-size: 3pt; font-family: DejaVu Sans Mono, monospace; color: #475569; }
    </style>
</head>
<body>

<table class="card"><tr><td class="pad">
    <table width="100%"><tr>
        <td width="14" valign="middle">
            @if (!empty($iconDataUri))
                <img src="{{ $iconDataUri }}" width="12" height="12" alt="">
            @endif
        </td>
        <td valign="middle">
            <div class="brand">ALMAPET ID</div>
            <div class="sub">Registro nacional de identificación animal</div>
        </td>
        <td width="88" class="cui" valign="middle">
            CÓDIGO<br><b>{{ $chip->certificate_code }}</b>
        </td>
    </tr></table>

    <div class="bar">&nbsp;</div>

    <table width="100%"><tr>
        <td width="50" valign="top" align="center">
            @if (!empty($photoDataUri))
                <img src="{{ $photoDataUri }}" width="42" height="50" alt="Foto">
            @else
                <table width="42" height="50" style="border:0.5pt solid #94a3b8;background:#f1f5f9;"><tr>
                    <td align="center" valign="middle" style="font-size:3.5pt;color:#94a3b8;">SIN FOTO</td>
                </tr></table>
            @endif
            @if (!empty($qrPng))
                <img src="{{ $qrPng }}" width="32" height="32" alt="QR" style="margin-top:2pt;">
            @endif
            <div class="pc">{{ $chip->public_code }}</div>
        </td>
        <td valign="top" style="padding-left:5pt;">
            <div class="lbl">Apellido del titular</div>
            <div class="val">{{ $owner?->lastname ?: '—' }}</div>
            <div style="height:2pt;"></div>
            <div class="lbl">Nombre de la mascota</div>
            <div class="val">{{ $animal?->name ?? '—' }}</div>
            <div style="height:2pt;"></div>
            <table width="100%"><tr>
                <td width="18%"><div class="lbl">Sexo</div><div class="val">{{ $sexShort }}</div></td>
                <td width="28%"><div class="lbl">Nacionalidad</div><div class="val">{{ $nationalityCode }}</div></td>
                <td width="54%"><div class="lbl">Fecha de nacimiento</div><div class="val">{{ $animal?->birth_date?->format('d  m  Y') ?? '—' }}</div></td>
            </tr></table>
            <div style="height:2pt;"></div>
            <div class="lbl">Raza / especie</div>
            <div class="val">{{ $animal?->breed ?: ($animal?->species ?? '—') }}</div>
            <div style="height:2pt;"></div>
            <table width="100%"><tr>
                <td width="50%"><div class="lbl">Fecha de emisión</div><div class="val">{{ $issuedAt->format('d  m  Y') }}</div></td>
                <td width="50%"><div class="lbl">Fecha de caducidad</div><div class="cad">{{ $expiresAt->format('d  m  Y') }}</div></td>
            </tr></table>
        </td>
        <td width="38" valign="middle" align="center">
            @if (!empty($watermarkDataUri))
                <img src="{{ $watermarkDataUri }}" width="34" height="34" alt="">
            @endif
        </td>
    </tr></table>

    <div class="foot">
        Microchip <span class="mono">{{ $chip->microchip }}</span>
        · Vigencia 3 años
        · {{ $organization?->name ?? 'AlmaPet ID' }}
        · Formato DNI Perú 85,60 × 53,98 mm
    </div>
</td></tr></table>

<table class="back"><tr><td class="back-inner">
    @if (!empty($iconBackDataUri))
        <img src="{{ $iconBackDataUri }}" width="42" height="42" alt="">
        <div style="height:6pt;"></div>
    @endif
    <div class="btitle">ALMAPET ID</div>
    <div class="bsub">Identidad digital animal</div>
    <div class="bcode">{{ $chip->certificate_code }} · {{ $chip->public_code }}</div>
</td></tr></table>

</body>
</html>
