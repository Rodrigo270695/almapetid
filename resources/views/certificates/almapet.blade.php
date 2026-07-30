<!DOCTYPE html>
<html lang="es">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; }
        img { display: block; border: 0; }
        .back { page-break-before: always; }
    </style>
</head>
<body>
<img src="{{ $frontDataUri }}" width="242.65" height="153.01" alt="Anverso">
<img class="back" src="{{ $backDataUri }}" width="242.65" height="153.01" alt="Reverso">
</body>
</html>
