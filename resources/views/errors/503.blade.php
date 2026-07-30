@include('errors.layout', [
    'code' => 503,
    'title' => 'Servicio no disponible',
    'description' => 'Estamos en mantenimiento o el servicio no responde. Vuelve a intentar en unos minutos.',
    'accent' => '#e07a5f',
])
