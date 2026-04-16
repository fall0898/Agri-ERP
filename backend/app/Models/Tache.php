<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tache extends Model
{
    use HasFactory;

    protected $fillable = [
        'organisation_id', 'employe_id', 'champ_id', 'culture_id',
        'titre', 'description', 'date_debut', 'date_fin', 'statut', 'priorite',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function organisation(): BelongsTo
    {
        return $this->belongsTo(Organisation::class);
    }

    public function employe(): BelongsTo
    {
        return $this->belongsTo(Employe::class);
    }

    public function champ(): BelongsTo
    {
        return $this->belongsTo(Champ::class);
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}
