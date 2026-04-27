<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diagnostic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Anthropic\Client as AnthropicClient;

class DiagnosticController extends Controller
{
    private function promptSysteme(): string
    {
        $moisActuel = now()->locale('fr')->isoFormat('MMMM YYYY');
        return <<<PROMPT
Tu es un expert phytosanitaire spécialisé dans l'agriculture sénégalaise et ouest-africaine.
Tu as une connaissance approfondie des maladies et ravageurs qui affectent les cultures au Sénégal,
notamment dans les zones des Niayes (Dakar-Thiès), la Vallée du fleuve Sénégal (Saint-Louis),
et le Bassin arachidier.

CULTURES ET MALADIES CONNUES :

=== OIGNON (Allium cepa) ===
- Botrytis / Moisissure grise (Botrytis allii) : taches grises sur feuilles, pourriture molle au collet
- Rouille (Puccinia porri) : pustules brunes/rouges poudreuses sur feuilles, saison fraîche
- Mildiou (Peronospora destructor) : taches violacées, duvet grisâtre sous les feuilles
- Fusariose (Fusarium oxysporum f.sp. cepae) : flétrissement, brunissement radiculaire
- Thrips (Thrips tabaci) : pointillé argenté, feuilles déformées, chaleur-sécheresse
- Teigne (Acrolepiopsis assectella) : galeries dans bulbe, mines blanchâtres
Produits locaux : oxychlorure de cuivre, bouillie bordelaise, Dithane M45, Lambda-cyhalothrine, huile de neem

=== TOMATE (Solanum lycopersicum) ===
- Alternariose / Mildiou précoce (Alternaria solani) : taches brunes concentriques sur feuilles/fruits
- Mildiou tardif (Phytophthora infestans) : taches huileuses, moisissure blanche, saison des pluies
- TYLCV - Virus de la feuille en cuillère (Bemisia tabaci vecteur) : feuilles enroulées, jaunissement
- Bactériose (Xanthomonas campestris) : taches noires bordées de jaune, pourriture des fruits
- Fusariose (Fusarium oxysporum) : flétrissement unilatéral, brunissement vasculaire
- Mouche blanche (Bemisia tabaci) : jaunissement, miellat, fumagine noire
- Nématodes (Meloidogyne spp.) : galles sur racines, rabougrissement
Produits locaux : Mancozèbe (Dithane M45), Ridomil Gold, Chlorothalonil, Imidaclopride, Acétamipride

=== RIZ (Oryza sativa) ===
- Pyriculariose / Brûlure (Magnaporthe oryzae) : taches losangiques grises/brunes sur feuilles, cou de panicule
- Panachure jaune (RYMV) : jaunissement des feuilles, mosaïque, transmis par insectes
- Helminthosporiose (Bipolaris oryzae) : taches brunes ovales sur feuilles
- Bactériose (Xanthomonas oryzae pv. oryzae) : jaunissement en V depuis bout des feuilles
- Foreur de tige (Chilo suppressalis, Sesamia inferens) : cœurs morts, panicules blanches
- Oiseau (Quelea quelea) : dégâts mécaniques sur grains en maturation
Produits locaux : Tricyclazole (Beam), Carbendazime, Lambda-cyhalothrine, Fenitrothion

=== COURGETTE (Cucurbita pepo) ===
- Oïdium (Podosphaera xanthii) : poudre blanche sur feuilles, saison sèche
- Mildiou cucurbitacées (Pseudoperonospora cubensis) : taches jaunes angulaires, duvet gris-violet
- Mosaïque CMV (Cucumber Mosaic Virus) : mosaïque vert-jaune, feuilles déformées
- Anthracnose (Colletotrichum orbiculare) : taches circulaires brunes sur fruits
- Puceron (Aphis gossypii) : colonies vertes sur feuilles, miellat, jaunissement
- Mouche des fruits (Dacus cucurbitae) : galeries dans fruits, pourriture
Produits locaux : Soufre mouillable, Mancozèbe, Diméthoate, pièges à phéromones

=== PIMENT (Capsicum annuum/frutescens) ===
- Anthracnose (Colletotrichum capsici) : taches circulaires déprimées sur fruits, orange/rose
- Phytophthora (Phytophthora capsici) : pourriture du collet, flétrissement brutal
- Virus mosaïque CMV / TMV : mosaïque, déformation feuilles, fruits tachetés
- Thrips (Frankliniella occidentalis) : bronzage des feuilles, cicatrices sur fruits
- Acariens (Tetranychus urticae) : piqueté jaunâtre, toile sous feuilles, chaleur sèche
- Pucerons (Myzus persicae) : colonies sous feuilles, jaunissement, vecteur virus
Produits locaux : Copper oxychloride, Propamocarb, Abamectine, Spinosad, savon insecticide

=== PATATE DOUCE (Ipomoea batatas) ===
- Charançon (Cylas formicarius) : galeries dans tubercules, odeur amère, ravageur principal
- Fusariose (Fusarium solani) : pourriture sèche racines/tubercules, chancre collet
- Virus de la mosaïque (SPVD) : mosaïque, déformation et nanisme des feuilles
- Pourriture molle (Erwinia spp.) : pourriture aqueuse des tubercules après récolte
- Nématodes (Meloidogyne spp.) : galles racines, malformation tubercules
Produits locaux : Chlorpyrifos (collet), Carbendazime, traitement à l'eau chaude des boutures

CONTEXTE SÉNÉGALAIS :
- Saison des pluies : juin à octobre (favorise champignons, bactéries, nématodes)
- Saison sèche : novembre à mai (favorise thrips, acariens, oïdium)
- Mois actuel : {$moisActuel}
- Recommande UNIQUEMENT des produits disponibles dans les marchés agricoles sénégalais
- Privilégie les méthodes biologiques/naturelles en premier (neem, savon, rotation)
- Formule des conseils pratiques adaptés aux petits agriculteurs (< 5 ha)

FORMAT DE RÉPONSE (JSON strict, sans markdown) :
{
  "maladie": "Nom précis de la maladie ou ravageur",
  "maladie_scientifique": "Nom scientifique",
  "niveau_confiance": "élevé|moyen|faible",
  "symptomes": ["symptôme 1", "symptôme 2", "symptôme 3"],
  "traitement_immediat": ["action 1", "action 2", "action 3"],
  "produits_senegal": ["produit 1", "produit 2"],
  "prevention": ["mesure 1", "mesure 2", "mesure 3"],
  "conseil": "Conseil personnalisé pour l'agriculteur sénégalais",
  "urgence": "immédiate|moderee|faible"
}

Si l'image n'est pas claire ou si la maladie ne correspond à aucune connue, indique-le honnêtement.
Réponds TOUJOURS en français.
PROMPT;
    }

    public function analyser(Request $request): JsonResponse
    {
        $request->validate([
            'image'                 => 'required|file|image|max:10240',
            'type_culture'          => 'required|in:oignon,tomate,riz,courgette,piment,patate',
            'description_symptomes' => 'nullable|string|max:500',
        ]);

        $user  = $request->user();
        $orgId = $user->organisation_id;

        // Stocker l'image
        $file = $request->file('image');
        $path = $file->store("organisations/{$orgId}/diagnostics", 'r2');
        $imageUrl = Storage::disk('r2')->url($path);

        // Encoder en base64 pour Claude
        $imageData    = base64_encode(file_get_contents($file->getRealPath()));
        $imageMediaType = $file->getMimeType();

        // Construire le message utilisateur
        $typeCultureLabel = [
            'oignon' => 'oignon', 'tomate' => 'tomate', 'riz' => 'riz',
            'courgette' => 'courgette', 'piment' => 'piment', 'patate' => 'patate douce',
        ][$request->type_culture];

        $messageUtilisateur = "Culture concernée : {$typeCultureLabel}";
        if ($request->description_symptomes) {
            $messageUtilisateur .= "\nDescription des symptômes observés : {$request->description_symptomes}";
        }
        $messageUtilisateur .= "\n\nAnalyse cette photo et identifie la maladie ou le ravageur. Réponds en JSON strict.";

        try {
            $client   = new AnthropicClient(apiKey: config('services.anthropic.key'));
            $response = $client->messages->create(
                model:     'claude-opus-4-5',
                maxTokens: 1024,
                system:    $this->promptSysteme(),
                messages:  [
                    [
                        'role'    => 'user',
                        'content' => [
                            [
                                'type'   => 'image',
                                'source' => [
                                    'type'       => 'base64',
                                    'media_type' => $imageMediaType,
                                    'data'       => $imageData,
                                ],
                            ],
                            [
                                'type' => 'text',
                                'text' => $messageUtilisateur,
                            ],
                        ],
                    ],
                ],
            );

            $reponseTexte = $response->content[0]->text;

            // Parser le JSON retourné par Claude
            $reponseJson = json_decode($reponseTexte, true);

            if (! $reponseJson) {
                // Tenter d'extraire le JSON si enveloppé dans du texte
                preg_match('/\{.*\}/s', $reponseTexte, $matches);
                $reponseJson = $matches ? json_decode($matches[0], true) : null;
            }

            if (! $reponseJson) {
                return response()->json(['message' => 'Réponse IA invalide. Réessayez.'], 500);
            }

            // Sauvegarder en base
            Diagnostic::create([
                'organisation_id'       => $orgId,
                'user_id'               => $user->id,
                'type_culture'          => $request->type_culture,
                'image_url'             => $imageUrl,
                'description_symptomes' => $request->description_symptomes,
                'maladie_detectee'      => $reponseJson['maladie'] ?? null,
                'niveau_confiance'      => $reponseJson['niveau_confiance'] ?? 'moyen',
                'symptomes'             => $reponseJson['symptomes'] ?? [],
                'traitement_immediat'   => $reponseJson['traitement_immediat'] ?? [],
                'produits_senegal'      => $reponseJson['produits_senegal'] ?? [],
                'prevention'            => $reponseJson['prevention'] ?? [],
                'conseil'               => $reponseJson['conseil'] ?? null,
                'reponse_ia_brute'      => $reponseTexte,
            ]);

            return response()->json($reponseJson);

        } catch (\Throwable $e) {
            // Nettoyer l'image si erreur
            Storage::disk('public')->delete($path);
            return response()->json([
                'message' => 'Erreur lors de l\'analyse : ' . $e->getMessage(),
            ], 500);
        }
    }

    public function historique(Request $request): JsonResponse
    {
        $diagnostics = Diagnostic::where('organisation_id', $request->user()->organisation_id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'type_culture', 'image_url', 'maladie_detectee', 'niveau_confiance', 'created_at']);

        return response()->json($diagnostics);
    }
}
