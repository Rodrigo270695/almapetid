<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Sponsor extends Model
{
    protected $fillable = [
        'code',
        'name',
        'tagline',
        'url',
        'logo_path',
        'active',
        'featured',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
            'featured' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function logoUrl(): ?string
    {
        if (blank($this->logo_path)) {
            return null;
        }

        if (str_starts_with($this->logo_path, 'http://') || str_starts_with($this->logo_path, 'https://')) {
            return $this->logo_path;
        }

        if (str_starts_with($this->logo_path, '/')) {
            return asset(ltrim($this->logo_path, '/'));
        }

        return asset('storage/'.$this->logo_path);
    }

    /**
     * @return list<array{code: string, name: string, tagline: string|null, url: string|null, logo_url: string|null, featured: bool}>
     */
    public static function publicCatalog(): array
    {
        /** @var Collection<int, self> $rows */
        $rows = static::query()
            ->where('active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return $rows
            ->map(fn (self $s) => [
                'code' => $s->code,
                'name' => $s->name,
                'tagline' => $s->tagline,
                'url' => $s->url,
                'logo_url' => $s->logoUrl(),
                'featured' => $s->featured,
            ])
            ->values()
            ->all();
    }
}
