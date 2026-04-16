<?php

namespace App\Services\Abonnement\PlanStrategies;

interface PlanStrategyInterface
{
    public function canCreateChamp(int $currentCount): bool;
    public function canCreateCulture(int $currentCount): bool;
    public function canAddUser(int $currentCount): bool;
    public function canExportExcel(): bool;
    public function canImportCsv(): bool;
    public function canAccessMeteo(): bool;
    public function canSendSmsWhatsapp(): bool;
    public function canCompareN1(): bool;
    public function canViewRentabiliteCulture(): bool;
    public function canAccessAccompagnement(): bool;
    public function getMaxChamps(): int|string;
    public function getMaxUsers(): int|string;
    public function getMaxCultures(): int|string;
    public function getMaxStorageMb(): int;
    public function getPlanName(): string;
}
