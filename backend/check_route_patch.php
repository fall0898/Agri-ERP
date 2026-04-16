<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Http\Request;

$super = User::where('role', 'super_admin')->first();
if (!$super) {
    echo "Super admin not found\n";
    exit(1);
}

$token = $super->createToken('debug-token')->plainTextToken;
$target = User::where('role', 'lecteur')->first();
if (!$target) {
    echo "Target user not found\n";
    exit(1);
}

$targetId = $target->id;
$payload = ['est_actif' => false];
$content = json_encode($payload);

$request = Request::create(
    '/api/utilisateurs/' . $targetId,
    'PATCH',
    [],
    [],
    [],
    [
        'HTTP_AUTHORIZATION' => 'Bearer ' . $token,
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
    ],
    $content
);

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

$target = $target->fresh();
echo "Target est_actif now= " . ($target->est_actif ? 'true' : 'false') . "\n";
