<?php

namespace App\Events;

use App\Models\UtilisationIntrant;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class IntrantUtilise
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly UtilisationIntrant $utilisation) {}
}
