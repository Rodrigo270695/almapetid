<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Para bases ya creadas con el esquema anterior. En installs nuevos
     * `create_users_table` ya incluye estas columnas.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        $addedColumns = false;

        Schema::table('users', function (Blueprint $table) use (&$addedColumns) {
            if (! Schema::hasColumn('users', 'lastname')) {
                $table->string('lastname')->default('')->after('name');
                $addedColumns = true;
            }

            if (! Schema::hasColumn('users', 'document_type')) {
                $table->string('document_type', 32)->nullable()->after('lastname');
                $addedColumns = true;
            }

            if (! Schema::hasColumn('users', 'document_number')) {
                $table->string('document_number', 64)->nullable()->after('document_type');
                $addedColumns = true;
            }
        });

        if ($addedColumns) {
            DB::table('users')
                ->orderBy('id')
                ->chunkById(100, function ($rows): void {
                    foreach ($rows as $row) {
                        $lastname = (string) ($row->lastname ?? '');
                        if ($lastname !== '') {
                            continue;
                        }

                        $parts = preg_split('/\s+/', trim((string) $row->name), 2) ?: [];
                        $first = $parts[0] ?? (string) $row->name;
                        $last = $parts[1] ?? '';

                        DB::table('users')->where('id', $row->id)->update([
                            'name' => $first !== '' ? $first : 'User',
                            'lastname' => $last,
                        ]);
                    }
                });

            $hasCompositeUnique = collect(Schema::getIndexes('users'))->contains(
                function (array $index): bool {
                    $cols = $index['columns'] ?? [];

                    return ($index['unique'] ?? false)
                        && $cols === ['document_type', 'document_number'];
                },
            );

            if (! $hasCompositeUnique) {
                Schema::table('users', function (Blueprint $table) {
                    $table->unique(['document_type', 'document_number']);
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op seguro: el esquema canónico vive en create_users_table.
    }
};
