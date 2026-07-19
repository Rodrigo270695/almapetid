<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSponsorController extends Controller
{
    public function index(): Response
    {
        $sponsors = Sponsor::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn (Sponsor $s) => [
                'id' => $s->id,
                'code' => $s->code,
                'name' => $s->name,
                'tagline' => $s->tagline,
                'url' => $s->url,
                'logo_url' => $s->logoUrl(),
                'active' => $s->active,
                'featured' => $s->featured,
                'sort_order' => $s->sort_order,
            ]);

        return Inertia::render('platform/sponsors/index', [
            'sponsors' => $sponsors,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        if ($request->hasFile('logo')) {
            $data['logo_path'] = $request->file('logo')->store('sponsors', 'public');
        }

        unset($data['logo']);

        Sponsor::query()->create($data);

        return back()->with('success', 'Auspiciador creado.');
    }

    public function update(Request $request, Sponsor $sponsor): RedirectResponse
    {
        $data = $this->validated($request, $sponsor);

        if ($request->hasFile('logo')) {
            $this->deleteStoredLogo($sponsor);
            $data['logo_path'] = $request->file('logo')->store('sponsors', 'public');
        }

        unset($data['logo']);

        $sponsor->update($data);

        return back()->with('success', 'Auspiciador actualizado.');
    }

    public function destroy(Sponsor $sponsor): RedirectResponse
    {
        $this->deleteStoredLogo($sponsor);
        $sponsor->delete();

        return back()->with('success', 'Auspiciador eliminado.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?Sponsor $sponsor = null): array
    {
        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:40', 'regex:/^[a-z0-9\-]*$/'],
            'name' => ['required', 'string', 'max:120'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'url' => ['nullable', 'url', 'max:500'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'active' => ['sometimes', 'boolean'],
            'featured' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:9999'],
        ]);

        $data['active'] = $request->boolean('active', true);
        $data['featured'] = $request->boolean('featured', false);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        $data['tagline'] = filled($data['tagline'] ?? null) ? trim((string) $data['tagline']) : null;
        $data['url'] = filled($data['url'] ?? null) ? trim((string) $data['url']) : null;

        $code = trim((string) ($data['code'] ?? ''));
        if ($code === '') {
            $code = Str::slug((string) $data['name']);
        }
        if ($code === '') {
            $code = 'sponsor-'.Str::lower(Str::random(6));
        }
        $data['code'] = $code;

        $exists = Sponsor::query()
            ->where('code', $code)
            ->when($sponsor, fn ($q) => $q->where('id', '!=', $sponsor->id))
            ->exists();

        if ($exists) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'code' => 'Ese código ya está en uso.',
            ]);
        }

        return $data;
    }

    private function deleteStoredLogo(Sponsor $sponsor): void
    {
        $path = (string) $sponsor->logo_path;
        if ($path === '' || str_starts_with($path, '/') || str_starts_with($path, 'http')) {
            return;
        }

        Storage::disk('public')->delete($path);
    }
}
