<?php

namespace App\Events;

use App\Models\Organisation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TenantCree
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Organisation $organisation,
        public readonly User $adminUser
    ) {}
}
