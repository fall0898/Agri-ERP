<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Tenant\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RegisterController extends Controller
{
    public function __construct(private TenantService $tenantService) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:100',
            'nom_organisation' => 'required|string|max:200',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => 'required|string|min:8|confirmed',
            'telephone' => 'nullable|string|max:20',
            'devise' => 'nullable|string|max:5',
        ], [
            'nom.required' => 'Le nom est obligatoire.',
            'nom_organisation.required' => "Le nom de l'organisation est obligatoire.",
            'email.required' => "L'adresse email est obligatoire.",
            'email.email' => "L'adresse email n'est pas valide.",
            'email.unique' => 'Cette adresse email est déjà utilisée.',
            'password.required' => 'Le mot de passe est obligatoire.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.confirmed' => 'Les mots de passe ne correspondent pas.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $result = $this->tenantService->register($validator->validated());

        return response()->json([
            'message' => 'Inscription réussie ! Bienvenue sur Agri-ERP.',
            'token' => $result['token'],
            'user' => $result['user'],
        ], 201);
    }
}
