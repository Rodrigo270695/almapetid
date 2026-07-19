<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Species extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function breeds(): HasMany
    {
        return $this->hasMany(Breed::class)->orderBy('sort_order')->orderBy('name');
    }

    public static function makeSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'especie';
        $slug = $base;
        $i = 1;
        while (self::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }
}
