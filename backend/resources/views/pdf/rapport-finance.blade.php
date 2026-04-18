<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #111827; background: #fff; }

        /* ── EN-TÊTE ── */
        .header { background: #15803D; color: #fff; padding: 20px 28px; display: table; width: 100%; }
        .header-left  { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }
        .header-logo  { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
        .header-sub   { font-size: 11px; opacity: .85; margin-top: 3px; }
        .header-org   { font-size: 15px; font-weight: bold; }
        .header-date  { font-size: 10px; opacity: .85; margin-top: 4px; }

        /* ── TITRE DU RAPPORT ── */
        .rapport-title { background: #DCFCE7; border-left: 5px solid #15803D; padding: 12px 28px; }
        .rapport-title h2 { font-size: 14px; font-weight: bold; color: #14532D; }
        .rapport-title p  { font-size: 10px; color: #166534; margin-top: 3px; }

        /* ── SECTIONS ── */
        .section { padding: 18px 28px 0; }
        .section-title { font-size: 12px; font-weight: bold; color: #15803D; text-transform: uppercase;
                         letter-spacing: .5px; border-bottom: 2px solid #BBF7D0; padding-bottom: 4px; margin-bottom: 12px; }

        /* ── KPI BOXES ── */
        .kpi-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; }
        .kpi-box  { display: table-cell; width: 25%; background: #F0FDF4; border: 1px solid #BBF7D0;
                    border-radius: 6px; padding: 12px 10px; text-align: center; vertical-align: middle; }
        .kpi-box.red    { background: #FFF1F2; border-color: #FECDD3; }
        .kpi-box.blue   { background: #EFF6FF; border-color: #BFDBFE; }
        .kpi-box.yellow { background: #FFFBEB; border-color: #FDE68A; }
        .kpi-label { font-size: 9px; color: #6B7280; text-transform: uppercase; letter-spacing: .4px; margin-bottom: 4px; }
        .kpi-value { font-size: 16px; font-weight: bold; color: #15803D; }
        .kpi-box.red    .kpi-value { color: #DC2626; }
        .kpi-box.blue   .kpi-value { color: #2563EB; }
        .kpi-box.yellow .kpi-value { color: #D97706; }

        /* ── TABLES ── */
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
        thead th { background: #15803D; color: #fff; padding: 8px 10px; text-align: left; font-size: 10px; }
        thead th.right { text-align: right; }
        tbody tr:nth-child(even) { background: #F9FAFB; }
        tbody tr:nth-child(odd)  { background: #fff; }
        tbody td { padding: 7px 10px; border-bottom: 1px solid #F3F4F6; }
        tbody td.right { text-align: right; font-variant-numeric: tabular-nums; }
        tfoot td { padding: 8px 10px; font-weight: bold; background: #DCFCE7; border-top: 2px solid #15803D; }
        tfoot td.right { text-align: right; }

        /* ── POSITIVE / NEGATIVE ── */
        .pos { color: #15803D; }
        .neg { color: #DC2626; }

        /* ── PIED DE PAGE ── */
        .footer { margin-top: 28px; text-align: center; color: #9CA3AF; font-size: 9px;
                  border-top: 1px solid #E5E7EB; padding: 12px 28px; }
    </style>
</head>
<body>

{{-- EN-TÊTE --}}
<div class="header">
    <div class="header-left">
        <div class="header-logo">Agri-ERP</div>
        <div class="header-sub">Plateforme de gestion agricole</div>
    </div>
    <div class="header-right">
        <div class="header-org">{{ $organisation->nom }}</div>
        <div class="header-date">Rapport généré le {{ now()->format('d/m/Y à H:i') }}</div>
    </div>
</div>

{{-- TITRE --}}
<div class="rapport-title">
    <h2>Rapport Financier — Campagne {{ $periode }}</h2>
    <p>Synthèse des ventes, dépenses et résultats par exploitation</p>
</div>

{{-- KPIs --}}
<div class="section" style="padding-top: 18px;">
    <div class="section-title">Synthèse financière</div>
    <div class="kpi-grid">
        <div class="kpi-box">
            <div class="kpi-label">Total ventes</div>
            <div class="kpi-value">{{ number_format($resume['total_ventes'], 0, ',', ' ') }}</div>
            <div style="font-size:9px;color:#6B7280;margin-top:2px">FCFA</div>
        </div>
        <div class="kpi-box red">
            <div class="kpi-label">Total dépenses</div>
            <div class="kpi-value">{{ number_format($resume['total_depenses'], 0, ',', ' ') }}</div>
            <div style="font-size:9px;color:#6B7280;margin-top:2px">FCFA</div>
        </div>
        <div class="kpi-box {{ $resume['solde_net'] >= 0 ? '' : 'red' }}">
            <div class="kpi-label">Solde net</div>
            <div class="kpi-value">{{ number_format($resume['solde_net'], 0, ',', ' ') }}</div>
            <div style="font-size:9px;color:#6B7280;margin-top:2px">FCFA</div>
        </div>
        <div class="kpi-box blue">
            <div class="kpi-label">Marge nette</div>
            <div class="kpi-value">
                @if($resume['total_ventes'] > 0)
                    {{ number_format($resume['solde_net'] / $resume['total_ventes'] * 100, 1, ',', '') }} %
                @else
                    —
                @endif
            </div>
        </div>
    </div>
</div>

{{-- PAR EXPLOITATION --}}
@if(count($parChamp) > 0)
<div class="section" style="margin-top: 20px;">
    <div class="section-title">Résultats par exploitation</div>
    <table>
        <thead>
            <tr>
                <th>Exploitation</th>
                <th class="right">Ventes (FCFA)</th>
                <th class="right">Dépenses (FCFA)</th>
                <th class="right">Solde net (FCFA)</th>
                <th class="right">Marge</th>
            </tr>
        </thead>
        <tbody>
            @foreach($parChamp as $champ)
            <tr>
                <td>{{ $champ['nom'] ?? 'Champ #'.$champ['champ_id'] }}</td>
                <td class="right pos">{{ number_format($champ['total_ventes'], 0, ',', ' ') }}</td>
                <td class="right neg">{{ number_format($champ['total_depenses'], 0, ',', ' ') }}</td>
                <td class="right {{ $champ['solde_net'] >= 0 ? 'pos' : 'neg' }}">
                    {{ number_format($champ['solde_net'], 0, ',', ' ') }}
                </td>
                <td class="right">
                    @if($champ['total_ventes'] > 0)
                        {{ number_format($champ['solde_net'] / $champ['total_ventes'] * 100, 1, ',', '') }} %
                    @else —
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td>TOTAL</td>
                <td class="right">{{ number_format($resume['total_ventes'], 0, ',', ' ') }}</td>
                <td class="right">{{ number_format($resume['total_depenses'], 0, ',', ' ') }}</td>
                <td class="right">{{ number_format($resume['solde_net'], 0, ',', ' ') }}</td>
                <td class="right">
                    @if($resume['total_ventes'] > 0)
                        {{ number_format($resume['solde_net'] / $resume['total_ventes'] * 100, 1, ',', '') }} %
                    @else —
                    @endif
                </td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

{{-- DÉPENSES PAR CATÉGORIE --}}
@if(count($depensesParCategorie) > 0)
<div class="section" style="margin-top: 20px;">
    <div class="section-title">Dépenses par catégorie</div>
    <table>
        <thead>
            <tr>
                <th>Catégorie</th>
                <th class="right">Montant (FCFA)</th>
                <th class="right">% du total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($depensesParCategorie as $cat)
            <tr>
                <td>{{ $cat['label'] }}</td>
                <td class="right">{{ number_format($cat['total'], 0, ',', ' ') }}</td>
                <td class="right">
                    @if($resume['total_depenses'] > 0)
                        {{ number_format($cat['total'] / $resume['total_depenses'] * 100, 1, ',', '') }} %
                    @else —
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td>TOTAL</td>
                <td class="right">{{ number_format($resume['total_depenses'], 0, ',', ' ') }}</td>
                <td class="right">100 %</td>
            </tr>
        </tfoot>
    </table>
</div>
@endif

<div class="footer">
    <p>{{ $organisation->nom }} — Rapport financier Agri-ERP</p>
    <p>Document confidentiel — généré automatiquement le {{ now()->format('d/m/Y à H:i') }}</p>
</div>

</body>
</html>
