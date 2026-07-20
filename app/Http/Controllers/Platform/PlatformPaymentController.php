<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\RegistrationPaymentRequest;
use App\Models\ChipRegistration;
use App\Models\Plan;
use App\Models\RegistrationPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PlatformPaymentController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50];

    private const SORTABLE = [
        'amount',
        'status',
        'provider',
        'channel',
        'paid_at',
        'created_at',
    ];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search', ''));
        $perPageRequested = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPageRequested, self::PER_PAGE_OPTIONS, true)
            ? $perPageRequested
            : 10;

        $sort = (string) $request->string('sort', 'paid_at');
        $direction = strtolower((string) $request->string('direction', 'desc'));
        $sortValid = in_array($sort, self::SORTABLE, true);
        $directionValid = in_array($direction, ['asc', 'desc'], true);
        if (! $sortValid) {
            $sort = 'paid_at';
            $sortValid = true;
        }
        if (! $directionValid) {
            $direction = 'desc';
            $directionValid = true;
        }

        $status = (string) $request->string('status', 'todos');
        $allowedStatus = [
            'todos',
            RegistrationPayment::STATUS_PENDING,
            RegistrationPayment::STATUS_PAID,
            RegistrationPayment::STATUS_FAILED,
            RegistrationPayment::STATUS_REFUNDED,
        ];
        if (! in_array($status, $allowedStatus, true)) {
            $status = 'todos';
        }

        $provider = (string) $request->string('provider', 'todos');
        $allowedProvider = [
            'todos',
            RegistrationPayment::PROVIDER_MANUAL,
            RegistrationPayment::PROVIDER_CULQI,
            RegistrationPayment::PROVIDER_NIUBIZ,
            RegistrationPayment::PROVIDER_STRIPE,
        ];
        if (! in_array($provider, $allowedProvider, true)) {
            $provider = 'todos';
        }

        $channel = (string) $request->string('channel', 'todos');
        $allowedChannel = [
            'todos',
            Plan::CHANNEL_DIRECT,
            Plan::CHANNEL_VETSAAS,
            Plan::CHANNEL_PARTNER,
        ];
        if (! in_array($channel, $allowedChannel, true)) {
            $channel = 'todos';
        }

        $query = RegistrationPayment::query()
            ->with([
                'plan:id,code,name',
                'user:id,name,lastname,email',
                'organization:id,name,ruc',
                'createdBy:id,name,lastname',
                'chipRegistration:id,microchip,public_code,status,certificate_code,animal_id',
                'chipRegistration.animal:id,name,owner_id',
                'chipRegistration.animal.owner:id,name,lastname,email,document_number',
            ])
            ->when($search !== '', function (Builder $q) use ($search): void {
                $q->where(function (Builder $inner) use ($search): void {
                    $inner->where('provider_reference', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('user', function (Builder $user) use ($search): void {
                            $user->where('email', 'like', "%{$search}%")
                                ->orWhere('name', 'like', "%{$search}%")
                                ->orWhere('lastname', 'like', "%{$search}%");
                        })
                        ->orWhereHas('plan', function (Builder $plan) use ($search): void {
                            $plan->where('name', 'like', "%{$search}%")
                                ->orWhere('code', 'like', "%{$search}%");
                        })
                        ->orWhereHas('organization', function (Builder $org) use ($search): void {
                            $org->where('name', 'like', "%{$search}%")
                                ->orWhere('ruc', 'like', "%{$search}%");
                        })
                        ->orWhereHas('chipRegistration', function (Builder $chip) use ($search): void {
                            $chip->where('microchip', 'like', "%{$search}%")
                                ->orWhere('public_code', 'like', "%{$search}%")
                                ->orWhere('certificate_code', 'like', "%{$search}%")
                                ->orWhereHas('animal', function (Builder $animal) use ($search): void {
                                    $animal->where('name', 'like', "%{$search}%")
                                        ->orWhereHas('owner', function (Builder $owner) use ($search): void {
                                            $owner->where('name', 'like', "%{$search}%")
                                                ->orWhere('lastname', 'like', "%{$search}%")
                                                ->orWhere('email', 'like', "%{$search}%")
                                                ->orWhere('document_number', 'like', "%{$search}%");
                                        });
                                });
                        });
                });
            })
            ->when($status !== 'todos', fn (Builder $q) => $q->where('status', $status))
            ->when($provider !== 'todos', fn (Builder $q) => $q->where('provider', $provider))
            ->when($channel !== 'todos', fn (Builder $q) => $q->where('channel', $channel));

        $dir = $directionValid ? $direction : 'desc';
        if ($sort === 'paid_at') {
            // Nulls last when DESC (pagos pendientes al final).
            $query->orderByRaw('paid_at '.$dir.' NULLS LAST')
                ->orderByDesc('created_at')
                ->orderByDesc('id');
        } else {
            $query->orderBy($sort, $dir)->orderByDesc('id');
        }

        $payments = $query->paginate($perPage)->withQueryString();

        $paidQuery = RegistrationPayment::query()->where('status', RegistrationPayment::STATUS_PAID);
        $earnedTotal = (float) (clone $paidQuery)->sum('amount');
        $earnedPlatform = (float) (clone $paidQuery)->sum(DB::raw('COALESCE(platform_amount, amount)'));

        return Inertia::render('platform/payments/index', [
            'payments' => $payments,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sort,
                'direction' => $dir,
                'status' => $status,
                'provider' => $provider,
                'channel' => $channel,
            ],
            'stats' => [
                'total' => RegistrationPayment::query()->count(),
                'pending' => RegistrationPayment::query()->where('status', RegistrationPayment::STATUS_PENDING)->count(),
                'paid' => RegistrationPayment::query()->where('status', RegistrationPayment::STATUS_PAID)->count(),
                'registrations' => ChipRegistration::query()
                    ->whereIn('status', [
                        ChipRegistration::STATUS_ACTIVE,
                        ChipRegistration::STATUS_LOST,
                        ChipRegistration::STATUS_PENDING_PAYMENT,
                    ])
                    ->count(),
                'registrations_active' => ChipRegistration::query()
                    ->where('status', ChipRegistration::STATUS_ACTIVE)
                    ->count(),
                'earned_total' => round($earnedTotal, 2),
                'earned_platform' => round($earnedPlatform, 2),
                'currency' => 'PEN',
                'coincidencias' => $payments->total(),
            ],
            'plans_catalog' => Plan::query()
                ->where('active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'amount', 'currency', 'billing_period']),
            'users_catalog' => User::query()
                ->orderBy('name')
                ->limit(200)
                ->get(['id', 'name', 'lastname', 'email']),
        ]);
    }

    public function store(RegistrationPaymentRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['created_by_user_id'] = $request->user()?->id;

        if (($data['status'] ?? null) === RegistrationPayment::STATUS_PAID && empty($data['paid_at'])) {
            $data['paid_at'] = now();
        }

        if (($data['status'] ?? null) !== RegistrationPayment::STATUS_PAID) {
            $data['paid_at'] = $data['paid_at'] ?? null;
        }

        RegistrationPayment::query()->create($data);

        return back()->with('success', 'Pago registrado correctamente.');
    }

    public function update(RegistrationPaymentRequest $request, RegistrationPayment $payment): RedirectResponse
    {
        $data = $request->validated();

        if (($data['status'] ?? null) === RegistrationPayment::STATUS_PAID && empty($data['paid_at'])) {
            $data['paid_at'] = $payment->paid_at ?? now();
        }

        if (in_array($data['status'] ?? null, [
            RegistrationPayment::STATUS_PENDING,
            RegistrationPayment::STATUS_FAILED,
        ], true)) {
            $data['paid_at'] = null;
        }

        $payment->update($data);

        return back()->with('success', 'Pago actualizado correctamente.');
    }

    public function markPaid(RegistrationPayment $payment): RedirectResponse
    {
        if ($payment->status === RegistrationPayment::STATUS_PAID) {
            return back()->with('info', 'Este pago ya estaba marcado como pagado.');
        }

        $payment->update([
            'status' => RegistrationPayment::STATUS_PAID,
            'paid_at' => now(),
        ]);

        return back()->with('success', 'Pago marcado como pagado.');
    }

    public function markRefunded(RegistrationPayment $payment): RedirectResponse
    {
        if ($payment->status !== RegistrationPayment::STATUS_PAID) {
            return back()->with('error', 'Solo se pueden reembolsar pagos en estado pagado.');
        }

        $payment->update([
            'status' => RegistrationPayment::STATUS_REFUNDED,
        ]);

        return back()->with('success', 'Pago marcado como reembolsado.');
    }
}
