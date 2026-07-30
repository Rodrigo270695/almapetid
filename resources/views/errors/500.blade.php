@include('errors.layout', [
    'code' => 500,
    'title' => 'Error del servidor',
    'description' => 'Ocurrió un problema inesperado. Intenta de nuevo en unos momentos.',
    'accent' => '#e07a5f',
])
