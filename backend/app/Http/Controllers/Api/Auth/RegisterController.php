<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Tenant\TenantService;
use App\Services\TelegramNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    public function __construct(
        private TenantService $tenantService,
        private TelegramNotificationService $telegram,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom'             => 'required|string|max:100',
            'nom_organisation' => 'required|string|max:200',
            'telephone'       => ['required', 'string', 'max:30', 'regex:/^(\+?221|00221)?[0-9]{8,9}$/', 'unique:users,telephone'],
            'password'        => 'required|string|min:8|confirmed',
            'pays'            => 'nullable|string|max:5',
            'devise'          => 'nullable|string|max:5',
        ], [
            'nom.required'             => 'Le nom est obligatoire.',
            'nom_organisation.required' => "Le nom de l'organisation est obligatoire.",
            'telephone.required'       => 'Le numéro de téléphone est obligatoire.',
            'telephone.regex'          => 'Numéro invalide — ex: 770809798 (Sénégal).',
            'telephone.unique'         => 'Ce numéro de téléphone est déjà utilisé.',
            'password.required'        => 'Le mot de passe est obligatoire.',
            'password.min'             => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed'       => 'Les mots de passe ne correspondent pas.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $result = $this->tenantService->register($validated);

        $this->telegram->sendNouvelleInscription($validated);

        return response()->json([
            'message' => 'Inscription réussie ! Bienvenue sur Agri-ERP.',
            'token' => $result['token'],
            'user' => $result['user'],
        ], 201);
    }
}
