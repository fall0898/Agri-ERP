<?php

namespace App\Models;

use App\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;

class CategorieDepense extends Model
{
    protected $table = 'categories_depenses';

    protected $fillable = ['organisation_id', 'nom', 'slug'];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope());
    }
}
