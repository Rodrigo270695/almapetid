<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $code }} · AlmaPet ID</title>
    <style>
        :root {
            --sky: #007598;
            --bg: #F7F9FB;
            --ink: #0f172a;
            --muted: #64748b;
            --coral: #e07a5f;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1.25rem;
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
            background:
                radial-gradient(ellipse at top, color-mix(in srgb, var(--sky) 16%, transparent), transparent 55%),
                var(--bg);
            color: var(--ink);
            text-align: center;
        }
        .code {
            font-size: clamp(4.5rem, 18vw, 7rem);
            font-weight: 700;
            letter-spacing: -0.04em;
            line-height: 1;
            color: {{ $accent }};
            opacity: 0.85;
            margin: 0;
        }
        h1 {
            margin: 1.25rem 0 0.5rem;
            font-size: clamp(1.35rem, 4vw, 1.85rem);
            letter-spacing: -0.02em;
        }
        p {
            margin: 0 auto;
            max-width: 28rem;
            color: var(--muted);
            line-height: 1.55;
            font-size: 0.95rem;
        }
        .actions {
            margin-top: 1.75rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
            justify-content: center;
        }
        a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 2.75rem;
            padding: 0 1.25rem;
            border-radius: 1rem;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.925rem;
        }
        .primary {
            background: var(--sky);
            color: #fff;
        }
        .ghost {
            border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent);
            color: var(--ink);
            background: #fff;
        }
        .brand {
            margin-top: 2.5rem;
            font-size: 0.75rem;
            color: var(--muted);
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <p class="code">{{ $code }}</p>
    <h1>{{ $title }}</h1>
    <p>{{ $description }}</p>
    <div class="actions">
        <a class="primary" href="{{ url('/') }}">Ir al inicio</a>
        <a class="ghost" href="javascript:history.back()">Volver atrás</a>
    </div>
    <p class="brand">AlmaPet ID</p>
</body>
</html>
