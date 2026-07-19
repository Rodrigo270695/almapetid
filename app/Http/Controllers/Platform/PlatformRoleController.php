<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Models\Role;
use App\Support\Auth\Permissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PlatformRoleController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    private const SORTABLE_COLUMNS = [
        'name',
        'description',
        'permissions_count',
        'created_at',
    ];

    private const TIPO_OPTIONS = ['todos', 'sistema', 'personalizado'];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search', ''));
        $perPageRequested = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPageRequested, self::PER_PAGE_OPTIONS, true)
            ? $perPageRequested
            : 10;

        $sort = (string) $request->string('sort', '');
        $direction = strtolower((string) $request->string('direction', 'desc'));
        $sortValid = in_array($sort, self::SORTABLE_COLUMNS, true);
        $directionValid = in_array($direction, ['asc', 'desc'], true);

        $tipo = (string) $request->string('tipo', 'todos');
        if (! in_array($tipo, self::TIPO_OPTIONS, true)) {
            $tipo = 'todos';
        }

        $query = $this->buildBaseQuery($search, $tipo);

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
            $query->orderByDesc('created_at');
        } else {
            $query->orderBy('name');
        }

        $roles = $query
            ->withCount('permissions')
            ->with(['permissions:id,name'])
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('platform/roles/index', [
            'roles' => $roles,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'tipo' => $tipo,
            ],
            'stats' => [
                'total' => Role::query()->where('guard_name', 'web')->count(),
                'sistema' => Role::query()->where('guard_name', 'web')->ofType('sistema')->count(),
                'personalizados' => Role::query()->where('guard_name', 'web')->ofType('personalizado')->count(),
                'coincidencias' => $roles->total(),
            ],
            'permissions_catalog' => $this->buildPermissionsCatalog(),
            'mutations_locked' => false,
        ]);
    }

    public function store(RoleRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Role::create([
            'name' => $data['name'],
            'guard_name' => 'web',
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('success', 'Rol creado correctamente.');
    }

    public function update(RoleRequest $request, Role $role): RedirectResponse
    {
        if ($role->is_system) {
            throw ValidationException::withMessages([
                'name' => 'No se puede modificar un rol del sistema.',
            ]);
        }

        $data = $request->validated();

        $role->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function updatePermissions(Request $request, Role $role): RedirectResponse
    {
        $data = $request->validate([
            'permissions' => ['array'],
            'permissions.*' => [
                'string',
                Rule::exists(config('permission.table_names.permissions'), 'name')
                    ->where('guard_name', 'web'),
            ],
        ]);

        $permissions = $data['permissions'] ?? [];
        $role->syncPermissions($permissions);

        $count = count($permissions);
        $message = $count === 0
            ? 'Se removieron todos los permisos del rol.'
            : ($count === 1
                ? '1 permiso asignado al rol.'
                : "{$count} permisos asignados al rol.");

        return back()->with('success', $message);
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->is_system) {
            throw ValidationException::withMessages([
                'name' => 'No se puede eliminar un rol del sistema.',
            ]);
        }

        $role->delete();

        return back()->with('success', 'Rol eliminado correctamente.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        $deletableIds = Role::query()
            ->where('guard_name', 'web')
            ->whereIn('id', $data['ids'])
            ->whereNotIn('name', Role::SYSTEM_ROLES)
            ->pluck('id')
            ->all();

        if ($deletableIds === []) {
            return back()->with('info', 'No se eliminaron roles: la selección solo incluía roles del sistema.');
        }

        $count = Role::query()->whereIn('id', $deletableIds)->delete();
        $skipped = count($data['ids']) - $count;

        $message = $count === 1
            ? '1 rol eliminado correctamente.'
            : "{$count} roles eliminados correctamente.";

        if ($skipped > 0) {
            $message .= sprintf(' (%d rol%s del sistema se omitieron)', $skipped, $skipped === 1 ? '' : 'es');
        }

        return back()->with('success', $message);
    }

    /**
     * @return Builder<Role>
     */
    private function buildBaseQuery(string $search, string $tipo): Builder
    {
        $query = Role::query()->where('guard_name', 'web');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('description', 'ILIKE', "%{$search}%");
            });
        }

        $query->ofType($tipo);

        return $query;
    }

    /**
     * @return array<int, array{module: string, permissions: array<int, array{id: int, name: string, action: string}>}>
     */
    private function buildPermissionsCatalog(): array
    {
        $all = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name']);

        return $this->groupPermissionsCatalog($all);
    }

    /**
     * @param  Collection<int, Permission>  $permissions
     * @return array<int, array{module: string, permissions: array<int, array{id: int, name: string, action: string}>}>
     */
    private function groupPermissionsCatalog(Collection $permissions): array
    {
        $catalogOrder = array_keys(Permissions::CATALOG);

        $grouped = [];
        foreach ($permissions as $perm) {
            [$module, $action] = $this->splitPermission($perm->name);
            $grouped[$module][] = [
                'id' => (int) $perm->id,
                'name' => $perm->name,
                'action' => $action,
            ];
        }

        $output = [];
        foreach ($catalogOrder as $module) {
            if (isset($grouped[$module])) {
                $output[] = [
                    'module' => $module,
                    'permissions' => $grouped[$module],
                ];
                unset($grouped[$module]);
            }
        }

        foreach ($grouped as $module => $items) {
            $output[] = [
                'module' => $module,
                'permissions' => $items,
            ];
        }

        return $output;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitPermission(string $name): array
    {
        $pos = strrpos($name, '.');

        if ($pos === false) {
            return [$name, ''];
        }

        return [substr($name, 0, $pos), substr($name, $pos + 1)];
    }
}
