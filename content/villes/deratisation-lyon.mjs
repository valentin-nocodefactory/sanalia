/** @type {import('./_schema.mjs').VillePage} */
export default {
  slug: '/deratisation/lyon/',
  ville: 'Lyon',
  region: 'Auvergne-Rhône-Alpes',
  departement: 'Rhône (69)',
  serviceIntentionPrimaire: 'deratisation',

  metaTitle: 'Dératisation Lyon, rats & souris sous 24h | Sanalia',
  metaDescription: 'Rats dans les caves, souris dans le bâti ancien ? Dératisation à Lyon et sa métropole, techniciens Certibiocide sous 24h. Devis gratuit : 06 67 46 48 97.',
  h1: 'Dératisation à Lyon : en finir avec les rats et les souris, du sous-sol au 9ᵉ',
  heroLead:
    "Rats dans les caves de la Presqu'île, souris dans les immeubles anciens de la Croix-Rousse : " +
    "nos techniciens certifiés Certibiocide traitent les rongeurs dans les 9 arrondissements et toute " +
    "la métropole lyonnaise, sous 24h et 7j/7, avec suivi jusqu'à éradication.",

  introLocale:
    "Entre le Rhône et la Saône, Lyon offre aux rongeurs deux corridors idéaux. " +
    "Le surmulot (rat brun) remonte des berges et du réseau d'assainissement vers les caves " +
    "profondes des immeubles de la Presqu'île et du Vieux-Lyon, dont les murs en pisé et les " +
    "pierres descellées lui laissent d'innombrables passages. Sur les pentes de la Croix-Rousse, " +
    "les anciens ateliers de canuts (hauts plafonds, planchers bois, gaines techniques verticales) " +
    "facilitent la circulation des souris grises d'un étage à l'autre. Les traboules, ces passages " +
    "couverts qui relient les immeubles, prolongent encore ces cheminements d'une cour à la suivante. " +
    "À la Part-Dieu comme à Gerland, les sous-sols de commerces et de bureaux, chauffés toute l'année, " +
    "maintiennent une activité constante, hiver compris. Nos techniciens Certibiocide connaissent ce " +
    "bâti lyonnais : ils localisent les points d'entrée, sécurisent l'appâtage et rebouchent durablement, " +
    "sans jamais laisser d'appât accessible aux enfants ou aux animaux domestiques.",

  zonesCouvertes: [
    'Lyon 1er', 'Lyon 2e (Presqu\'île)', 'Lyon 3e', 'Lyon 4e (Croix-Rousse)', 'Lyon 5e (Vieux-Lyon)',
    'Lyon 6e', 'Lyon 7e (Gerland)', 'Lyon 8e', 'Lyon 9e (Vaise)',
    'Villeurbanne', 'Vénissieux', 'Saint-Priest', 'Caluire-et-Cuire', 'Bron',
    'Tassin-la-Demi-Lune', 'Écully', 'Oullins', 'Vaulx-en-Velin',
  ],

  contexteLocal: [
    "Berges du Rhône et de la Saône : le surmulot y niche puis colonise les caves des immeubles riverains " +
      "de la Presqu'île, en particulier autour des quais et des ponts.",
    "Immeubles anciens en pisé et pierre (Vieux-Lyon, 1er, 5e) : matériaux poreux, caves voûtées et " +
      "vides sanitaires humides offrent aux rats des abris difficiles d'accès sans repérage précis.",
    "Traboules et cours communes : ces passages relient plusieurs immeubles et transforment un foyer isolé " +
      "en problème d'îlot, ce qui impose souvent un traitement coordonné à l'échelle de la copropriété.",
    "Croix-Rousse et ateliers de canuts : doubles hauteurs, planchers bois et gaines verticales laissent " +
      "les souris grises passer d'un logement à l'autre par les cloisons et les coffrages.",
  ],

  // Cas clients réels non fournis → bloc rendu en commentaire TODO côté HTML.
  interventionsRecentes: [],

  tarifIndicatif:
    "À Lyon, une dératisation résidentielle démarre le plus souvent autour de 130 à 250 € selon la surface, " +
    "l'espèce et le nombre de passages nécessaires ; le devis reste gratuit et sans engagement.",

  faqLocale: [
    {
      q: 'Quels arrondissements et communes de Lyon couvrez-vous pour la dératisation ?',
      a: "Les 9 arrondissements de Lyon ainsi que la métropole : Villeurbanne, Vénissieux, Saint-Priest, " +
         "Caluire-et-Cuire, Bron, Tassin-la-Demi-Lune, Écully, Oullins et Vaulx-en-Velin. " +
         "L'intervention est prioritaire dans Lyon intra-muros et les communes limitrophes.",
    },
    {
      q: 'Pourquoi trouve-t-on autant de rats près du Rhône et de la Saône ?',
      a: "Les berges et le réseau d'assainissement constituent l'habitat naturel du surmulot. Il remonte " +
         "ensuite vers les caves des immeubles riverains, surtout sur la Presqu'île où le bâti ancien " +
         "multiplie les points d'entrée. Le rebouchage des accès est indispensable pour éviter les récidives.",
    },
    {
      q: 'Un seul appartement est touché : faut-il traiter tout l\'immeuble à Lyon ?',
      a: "Souvent, oui. Dans les immeubles anciens de la Croix-Rousse ou du Vieux-Lyon, les souris circulent " +
         "par les gaines et les cloisons, et les traboules relient plusieurs cages d'escalier. Un traitement " +
         "coordonné avec le syndic donne un résultat bien plus durable qu'une action isolée.",
    },
    {
      q: 'Intervenez-vous en urgence pour des rats à Lyon ?',
      a: "Oui. Un rat qui traverse une cour de la Presqu'île en plein jour ou s'installe dans la cave d'un " +
         "immeuble ancien ne doit pas attendre : nous proposons une intervention rapide dans les 9 " +
         "arrondissements et les communes limitrophes (Villeurbanne, Caluire, Bron), week-end inclus.",
    },
    {
      q: 'La dératisation lyonnaise est-elle garantie ?',
      a: "Oui. Chaque intervention est garantie : si les rongeurs reviennent pendant la période couverte " +
         "(généralement 3 à 6 mois), nous repassons sans facturer de nouveau déplacement. Des contrôles " +
         "programmés vérifient que les postes d'appâtage ne sont plus visités et permettent d'ajuster le " +
         "dispositif si un accès a été rouvert.",
    },
  ],

  // Tokens locaux supplémentaires ignorés lors de la mesure de duplication.
  neutralizeExtra: [
    'Rhône', 'Saône', 'Presqu\'île', 'Vieux-Lyon', 'Croix-Rousse', 'Part-Dieu', 'Gerland',
    'Vaise', 'canut', 'canuts', 'traboule', 'traboules', 'pisé', 'métropole', 'Auvergne-Rhône-Alpes',
  ],
};
