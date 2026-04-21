<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Champ;

class Media extends Model
{
    use HasFactory;

    protected $table = 'medias';

    protected $fillable = [
        'culture_id', 'champ_id', 'type', 'fichier_url', 'fichier_path', 'fichier_nom',
        'taille_octets', 'description', 'date_prise',
    ];

    protected $casts = [
        'date_prise' => 'date',
        'taille_octets' => 'integer',
    ];

    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }

    public function champ(): BelongsTo
    {
        return $this->belongsTo(Champ::class);
    }
}
