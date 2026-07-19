<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\PlanRequest;
use App\Models\Plan;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformPlanController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50];

    private const SORTABLE = [
        'name',
        'code',
        'amount',
        'billing_period',
        'sort_order',
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
        $direction = strtolower((string) $request->string('direction', 'asc'));
        $sortValid = in_array($sort, self::SORTABLE, true);
        $directionValid = in_array($direction, ['asc', 'desc'], true);

        $status = (string) $request->string('status', 'todos');
        if (! in_array($status, ['todos', 'active', 'inactive'], true)) {
            $status = 'todos';
        }

        $period = (string) $request->string('period', 'todos');
        if (! in_array($period, ['todos', Plan::PERIOD_REGISTRATION, Plan::PERIOD_ANNUAL], true)) {
            $period = 'todos';
        }

        $query = Plan::query()
            ->withCount('payments')
            ->when($search !== '', function (Builder $q) use ($search): void {
                $q->where(function (Builder $inner) use ($search): void {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn (Builder $q) => $q->where('active', true))
            ->when($status === 'inactive', fn (Builder $q) => $q->where('active', false))
            ->when($period !== 'todos', fn (Builder $q) => $q->where('billing_period', $period));

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        } else {
            $query->orderBy('sort_order')->orderBy('name');
        }

        $plans = $query->paginate($perPage)->withQueryString();

        return Inertia::render('platform/plans/index', [
            'plans' => $plans,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'status' => $status,
                'period' => $period,
            ],
            'stats' => [
                'total' => Plan::query()->count(),
                'active' => Plan::query()->where('active', true)->count(),
                'annual' => Plan::query()->where('billing_period', Plan::PERIOD_ANNUAL)->count(),
                'coincidencias' => $plans->total(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('platform/plans/create');
    }

    public function store(PlanRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['active'] = $request->boolean('active', true);
        $data['is_default'] = $request->boolean('is_default', false);
        $data['sort_order'] = $this->nextSortOrder();

        DB::transaction(function () use ($data): void {
            if ($data['is_default']) {
                Plan::query()->where('is_default', true)->update(['is_default' => false]);
            }

            Plan::query()->create($data);
        });

        return redirect()
            ->route('platform.plans.index')
            ->with('success', 'Plan creado correctamente.');
    }

    public function edit(Plan $plan): Response
    {
        return Inertia::render('platform/plans/edit', [
            'plan' => $plan,
        ]);
    }

    public function update(PlanRequest $request, Plan $plan): RedirectResponse
    {
        $data = $request->validated();
        $data['active'] = $request->boolean('active', $plan->active);
        $data['is_default'] = $request->boolean('is_default', false);
        unset($data['sort_order']);

        DB::transaction(function () use ($plan, $data): void {
            if ($data['is_default']) {
                Plan::query()
                    ->where('is_default', true)
                    ->whereKeyNot($plan->id)
                    ->update(['is_default' => false]);
            }

            $plan->update($data);
        });

        return redirect()
            ->route('platform.plans.index')
            ->with('success', 'Plan actualizado correctamente.');
    }

    public function destroy(Plan $plan): RedirectResponse
    {
        if ($plan->payments()->exists()) {
            return back()->with('error', 'No se puede eliminar un plan con pagos asociados. Desactívalo en su lugar.');
        }

        $plan->delete();

        return back()->with('success', 'Plan eliminado correctamente.');
    }

    private function nextSortOrder(): int
    {
        return ((int) Plan::query()->max('sort_order')) + 1;
    }
}
