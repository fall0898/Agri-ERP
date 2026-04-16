<?php

namespace App\Events;

use App\Models\Organisation;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AbonnementExpire
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Organisation $organisation) {}
}
