@include('errors.layout', [
    'code' => 403,
    'title' => 'Acceso no permitido',
    'description' => 'No tienes permiso para ver esta página o tu sesión no alcanza para abrirla.',
    'accent' => '#d97706',
])
