<?php

namespace App\Models;

use App\Support\Auth\Roles as CanonicalRoles;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Rol de la aplicacion (extension del modelo nativo de Spatie).
 *
 * @property int $id
 * @property string $name
 * @property string $guard_name
 * @property ?string $description
 * @property-read bool $is_system
 */
class Role extends SpatieRole
{
    /**
     * Roles canonico de AlmaPet: no se editan ni eliminan desde el panel
     * (si se pueden sincronizar permisos, igual que en VetSaaS).
     *
     * @var list<string>
     */
    public const SYSTEM_ROLES = [
        CanonicalRoles::OWNER,
        CanonicalRoles::CLINIC_STAFF,
        CanonicalRoles::ORG_ADMIN,
        CanonicalRoles::PLATFORM_ADMIN,
    ];

    protected $appends = ['is_system'];

    protected $fillable = [
        'name',
        'guard_name',
        'description',
    ];

    protected function isSystem(): Attribute
    {
        return Attribute::make(
            get: fn () => in_array($this->name, self::SYSTEM_ROLES, true),
        );
    }

    /**
     * @param  Builder<Role>  $query
     * @return Builder<Role>
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        if ($type === 'sistema') {
            return $query->whereIn('name', self::SYSTEM_ROLES);
        }

        if ($type === 'personalizado') {
            return $query->whereNotIn('name', self::SYSTEM_ROLES);
        }

        return $query;
    }
}
