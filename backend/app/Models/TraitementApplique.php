<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TraitementApplique extends Model
{
    protected $table = 'traitements_appliques';

    protected $fillable = [
        'culture_id', 'organisation_id', 'user_id',
        'produit', 'matiere_active', 'dose', 'date_application', 'source',
    ];

    protected $casts = ['date_application' => 'date'];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
