<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'type',
        'ruc',
        'name',
        'address',
        'city',
        'country_code',
        'distrito_id',
        'departamento',
        'provincia',
        'distrito',
        'contact_email',
        'contact_phone',
        'logo_path',
        'active',
        'show_on_network',
        'vetsaas_tenant_id',
        'vetsaas_slug',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'show_on_network' => 'boolean',
            'distrito_id' => 'integer',
        ];
    }

    public function logoUrl(): ?string
    {
        if (blank($this->logo_path)) {
            return null;
        }

        if (str_starts_with($this->logo_path, 'http://')
            || str_starts_with($this->logo_path, 'https://')
            || str_starts_with($this->logo_path, '/')) {
            return str_starts_with($this->logo_path, '/')
                ? asset(ltrim($this->logo_path, '/'))
                : $this->logo_path;
        }

        return asset('storage/'.$this->logo_path);
    }

    /**
     * Clínicas activas con logo para el directorio / carrusel público.
     *
     * @return list<array{id: int, name: string, city: string|null, logo_url: string}>
     */
    public static function publicNetworkCatalog(): array
    {
        return static::query()
            ->where('active', true)
            ->where('show_on_network', true)
            ->where('type', 'clinic')
            ->whereNotNull('logo_path')
            ->where('logo_path', '!=', '')
            ->orderBy('name')
            ->get(['id', 'name', 'city', 'logo_path'])
            ->map(fn (self $org) => [
                'id' => $org->id,
                'name' => $org->name,
                'city' => $org->city,
                'logo_url' => $org->logoUrl(),
            ])
            ->filter(fn (array $row) => filled($row['logo_url']))
            ->values()
            ->all();
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function distritoModel(): BelongsTo
    {
        return $this->belongsTo(Distrito::class, 'distrito_id');
    }

    public function chipRegistrations(): HasMany
    {
        return $this->hasMany(ChipRegistration::class);
    }

    public function createdOwners(): HasMany
    {
        return $this->hasMany(Owner::class, 'created_by_organization_id');
    }
}
