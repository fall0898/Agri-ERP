<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intrant extends Model
{
    use HasFactory;

    protected $fillable = [
        'organisation_id', 'nom', 'categorie', 'unite', 'description', 'est_actif',
    ];

    protected $casts = [
        'est_actif' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }

    public function utilisations(): HasMany
    {
        return $this->hasMany(UtilisationIntrant::class);
    }
}
