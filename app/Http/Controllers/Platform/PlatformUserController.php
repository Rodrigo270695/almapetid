<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Models\Role;
use App\Models\User;
use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\Roles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PlatformUserController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    private const SORTABLE_COLUMNS = [
        'name',
        'lastname',
        'email',
        'created_at',
    ];

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

        $rol = trim((string) $request->string('rol', ''));

        $query = $this->buildBaseQuery($search, $rol);

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
            $query->orderByDesc('created_at');
        } else {
            $query->orderByDesc('created_at');
        }

        $users = $query
            ->with(['roles:id,name'])
            ->paginate($perPage)
            ->withQueryString();

        $rolesCatalog = Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name', 'description'])
            ->map(fn (Role $r) => [
                'id' => (int) $r->id,
                'name' => $r->name,
                'description' => $r->description,
                'is_system' => $r->is_system,
            ]);

        return Inertia::render('platform/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'rol' => $rol !== '' ? $rol : null,
            ],
            'stats' => [
                'total' => User::query()->count(),
                'platform_admins' => User::query()
                    ->role(Roles::PLATFORM_ADMIN)
                    ->count(),
                'coincidencias' => $users->total(),
            ],
            'roles_catalog' => $rolesCatalog,
            'auth_user_id' => $request->user()?->id,
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'lastname' => $data['lastname'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'document_type' => $data['document_type'] ?? null,
            'document_number' => $data['document_number'] ?? null,
            'password' => $data['password'],
            'email_verified_at' => now(),
        ]);

        $user->syncRoles([$data['role']]);

        if ($data['role'] === Roles::OWNER) {
            app(OwnerClaimService::class)->claimForUser($user->fresh());
        }

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        $payload = [
            'name' => $data['name'],
            'lastname' => $data['lastname'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'document_type' => $data['document_type'] ?? null,
            'document_number' => $data['document_number'] ?? null,
        ];

        if (! empty($data['password'])) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);
        $user->syncRoles([$data['role']]);

        if ($user->ownerProfile !== null) {
            $user->ownerProfile->forceFill(['phone' => $data['phone']])->save();
        }

        return back()->with('success', 'Usuario actualizado correctamente.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->id === $user->id) {
            throw ValidationException::withMessages([
                'id' => 'No puedes eliminar tu propia cuenta.',
            ]);
        }

        if ($user->hasRole(Roles::PLATFORM_ADMIN)) {
            throw ValidationException::withMessages([
                'id' => 'No se puede eliminar un administrador de plataforma desde el panel.',
            ]);
        }

        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        $currentId = $request->user()?->id;

        $deletableIds = User::query()
            ->whereIn('id', $data['ids'])
            ->when($currentId !== null, fn ($q) => $q->whereKeyNot($currentId))
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', Roles::PLATFORM_ADMIN);
            })
            ->pluck('id')
            ->all();

        if ($deletableIds === []) {
            return back()->with(
                'info',
                'No se eliminaron usuarios: la selección solo incluía cuentas protegidas (platform_admin o tu propia sesión).',
            );
        }

        $count = User::query()->whereIn('id', $deletableIds)->delete();
        $skipped = count($data['ids']) - $count;

        $message = $count === 1
            ? '1 usuario eliminado correctamente.'
            : "{$count} usuarios eliminados correctamente.";

        if ($skipped > 0) {
            $message .= sprintf(
                ' (%d cuenta%s protegida%s se omitieron)',
                $skipped,
                $skipped === 1 ? '' : 's',
                $skipped === 1 ? '' : 's',
            );
        }

        return back()->with('success', $message);
    }

    /**
     * @return Builder<User>
     */
    private function buildBaseQuery(string $search, string $rol): Builder
    {
        $query = User::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ILIKE', "%{$search}%")
                    ->orWhere('lastname', 'ILIKE', "%{$search}%")
                    ->orWhere('email', 'ILIKE', "%{$search}%")
                    ->orWhere('phone', 'ILIKE', "%{$search}%")
                    ->orWhere('document_number', 'ILIKE', "%{$search}%");
            });
        }

        if ($rol !== '') {
            $query->whereHas('roles', function ($q) use ($rol) {
                $q->where('name', $rol);
            });
        }

        return $query;
    }
}
