<?php

namespace Database\Seeders;

use App\Support\Geo\MojibakeFixer;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Carga ubigeo Perú desde database/data/ubigeo.sql
 * reparando mojibake (tildes / ñ) al insertar.
 */
class GeoSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('data/ubigeo.sql');

        if (! File::exists($path)) {
            $this->command?->error("No existe {$path}");

            return;
        }

        $sql = File::get($path);
        $lines = preg_split("/\r\n|\n|\r/", $sql) ?: [];

        $counts = [
            'paises' => 0,
            'departamentos' => 0,
            'provincias' => 0,
            'distritos' => 0,
        ];

        DB::transaction(function () use ($lines, &$counts): void {
            DB::table('distritos')->delete();
            DB::table('provincias')->delete();
            DB::table('departamentos')->delete();
            DB::table('paises')->delete();

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || ! str_starts_with($line, 'INSERT INTO ')) {
                    continue;
                }

                $fixed = $this->repairInsertLine($line);
                if ($fixed === null) {
                    continue;
                }

                DB::unprepared($fixed);

                if (str_contains($fixed, 'INSERT INTO paises ')) {
                    $counts['paises']++;
                } elseif (str_contains($fixed, 'INSERT INTO departamentos ')) {
                    $counts['departamentos']++;
                } elseif (str_contains($fixed, 'INSERT INTO provincias ')) {
                    $counts['provincias']++;
                } elseif (str_contains($fixed, 'INSERT INTO distritos ')) {
                    $counts['distritos']++;
                }
            }
        });

        // Postgres: sincronizar secuencias tras inserts con id explícito.
        if (DB::getDriverName() === 'pgsql') {
            foreach (array_keys($counts) as $table) {
                DB::statement(
                    "SELECT setval(pg_get_serial_sequence('{$table}', 'id'), COALESCE((SELECT MAX(id) FROM {$table}), 1))",
                );
            }
        }

        $this->command?->info(sprintf(
            'GeoSeeder: paises=%d departamentos=%d provincias=%d distritos=%d',
            $counts['paises'],
            $counts['departamentos'],
            $counts['provincias'],
            $counts['distritos'],
        ));
    }

    private function repairInsertLine(string $line): ?string
    {
        // Repara el literal del name: VALUES (..., 'NOMBRE', ...)
        if (! preg_match("/VALUES\s*\((.+)\)\s*;?\s*$/i", $line, $m)) {
            return $line;
        }

        $valuesPart = $m[1];
        $parts = $this->splitSqlValues($valuesPart);
        if (count($parts) < 3) {
            return $line;
        }

        // paises: id, name, status, ...
        // departamentos: id, pais_id, name, ...
        // provincias: id, departamento_id, name, ...
        // distritos: id, provincia_id, name, ...
        $nameIndex = str_contains($line, 'INSERT INTO paises ') ? 1 : 2;

        if (! isset($parts[$nameIndex])) {
            return $line;
        }

        $raw = $parts[$nameIndex];
        if (! str_starts_with($raw, "'") || ! str_ends_with($raw, "'")) {
            return $line;
        }

        $name = stripcslashes(substr($raw, 1, -1));
        $fixedName = MojibakeFixer::repair($name) ?? $name;
        $parts[$nameIndex] = "'".str_replace("'", "''", $fixedName)."'";

        $prefix = preg_replace('/VALUES\s*\(.+$/i', '', $line) ?? $line;

        return rtrim($prefix).'VALUES ('.implode(', ', $parts).');';
    }

    /**
     * @return list<string>
     */
    private function splitSqlValues(string $valuesPart): array
    {
        $parts = [];
        $current = '';
        $inString = false;
        $len = strlen($valuesPart);

        for ($i = 0; $i < $len; $i++) {
            $ch = $valuesPart[$i];

            if ($ch === "'" && $inString && ($i + 1) < $len && $valuesPart[$i + 1] === "'") {
                $current .= "''";
                $i++;
                continue;
            }

            if ($ch === "'") {
                $inString = ! $inString;
                $current .= $ch;
                continue;
            }

            if ($ch === ',' && ! $inString) {
                $parts[] = trim($current);
                $current = '';
                continue;
            }

            $current .= $ch;
        }

        if (trim($current) !== '') {
            $parts[] = trim($current);
        }

        return $parts;
    }
}
