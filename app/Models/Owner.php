<?php

namespace App\Models;

use App\Enums\DocumentType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Owner extends Model
{
    protected $fillable = [
        'document_type',
        'document_number',
        'name',
        'lastname',
        'email',
        'phone',
        'distrito_id',
        'departamento',
        'provincia',
        'distrito',
        'user_id',
        'created_by_organization_id',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'document_type' => DocumentType::class,
            'distrito_id' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function distritoModel(): BelongsTo
    {
        return $this->belongsTo(Distrito::class, 'distrito_id');
    }

    public function createdByOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'created_by_organization_id');
    }

    public function animals(): HasMany
    {
        return $this->hasMany(Animal::class);
    }

    public function fullName(): string
    {
        return trim($this->name.' '.$this->lastname);
    }
}
