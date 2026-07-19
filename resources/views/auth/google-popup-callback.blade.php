<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name') }} — Google</title>
        <style>
            body {
                margin: 0;
                min-height: 100vh;
                display: grid;
                place-items: center;
                font-family: system-ui, sans-serif;
                background: oklch(0.97 0.02 225);
                color: oklch(0.3 0.05 230);
            }
            .box {
                text-align: center;
                padding: 1.5rem;
            }
            .spin {
                width: 1.5rem;
                height: 1.5rem;
                border: 2px solid oklch(0.7 0.05 225);
                border-top-color: oklch(0.5 0.11 225);
                border-radius: 999px;
                margin: 0 auto 0.75rem;
                animation: spin 0.7s linear infinite;
            }
            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }
        </style>
    </head>
    <body>
        <div class="box">
            <div class="spin" aria-hidden="true"></div>
            <p>{{ $status === 'success' ? 'Listo…' : 'Cerrando…' }}</p>
        </div>
        <script>
            (function () {
                var payload = {
                    type: 'almapet-google-auth',
                    status: @json($status),
                    redirect: @json($redirect),
                    message: @json($message),
                };

                try {
                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage(payload, window.location.origin);
                        window.close();
                        return;
                    }
                } catch (e) {}

                if (payload.status === 'success' && payload.redirect) {
                    window.location.replace(payload.redirect);
                } else {
                    window.location.replace(@json(route('login')));
                }
            })();
        </script>
    </body>
</html>
