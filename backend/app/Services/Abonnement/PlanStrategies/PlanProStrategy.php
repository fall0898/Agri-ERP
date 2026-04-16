<?php

namespace App\Services\Abonnement\PlanStrategies;

class PlanProStrategy implements PlanStrategyInterface
{
    public function canCreateChamp(int $currentCount): bool { return $currentCount < 2; }
    public function canCreateCulture(int $currentCount): bool { return $currentCount < 3; }
    public function canAddUser(int $currentCount): bool { return $currentCount < 2; }
    public function canExportExcel(): bool { return true; }
    public function canImportCsv(): bool { return true; }
    public function canAccessMeteo(): bool { return true; }
    public function canSendSmsWhatsapp(): bool { return true; }
    public function canCompareN1(): bool { return true; }
    public function canViewRentabiliteCulture(): bool { return true; }
    public function canAccessAccompagnement(): bool { return false; }
    public function getMaxChamps(): int|string { return 2; }
    public function getMaxUsers(): int|string { return 2; }
    public function getMaxCultures(): int|string { return 3; }
    public function getMaxStorageMb(): int { return 2048; }
    public function getPlanName(): string { return 'pro'; }
}
