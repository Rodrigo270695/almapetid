<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Animal extends Model
{
    protected $fillable = [
        'owner_id',
        'name',
        'species',
        'breed',
        'sex',
        'color',
        'birth_date',
        'notes',
        'photo_path',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function photoUrl(): ?string
    {
        if (blank($this->photo_path)) {
            return null;
        }

        return asset('storage/'.$this->photo_path);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    public function chipRegistration(): HasOne
    {
        return $this->hasOne(ChipRegistration::class);
    }
}
