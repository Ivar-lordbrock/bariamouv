/* BariaMouv — data.js
 * Bibliothèque par défaut : les 36 exercices extraits des photos du livret APA
 * (« Mon activité physique adaptée à ma santé »), triés par catégorie.
 * Les consignes reprennent le livret ; les « tip » ajoutent les points de vigilance
 * propres au parcours bariatrique. Les phases sont indicatives : elles se valident
 * toujours avec l'équipe soignante.
 *
 * Pour ajouter un exercice par défaut : copier un bloc ex({...}) et déposer
 * l'image dans img/exercices/<id>.jpg.
 */
(() => {
  const CATEGORIES = [
    { id: 'mobilite', label: 'Mobilité', long: 'Mobilité articulaire', emoji: '🔄', color: '#0284c7' },
    { id: 'haut', label: 'Haut du corps', long: 'Tonicité des membres supérieurs', emoji: '💪', color: '#7c3aed' },
    { id: 'bas', label: 'Bas du corps', long: 'Tonicité des membres inférieurs', emoji: '🦵', color: '#059669' },
    { id: 'abdo', label: 'Sangle abdominale', long: 'Renforcement post-op de la sangle', emoji: '🎯', color: '#b45309' },
    { id: 'cardio', label: 'Cardio doux', long: 'Endurance cardio-respiratoire', emoji: '❤️', color: '#e11d48' },
    { id: 'equilibre', label: 'Équilibre', long: 'Équilibre et coordination', emoji: '⚖️', color: '#4f46e5' },
    { id: 'souplesse', label: 'Souplesse', long: 'Étirements', emoji: '🤸', color: '#0d9488' },
  ];

  const PHASES = {
    1: { label: 'Reprise douce', desc: "Premières semaines, avec l'accord de ton équipe : marche, mobilité, exercices assis sans charge." },
    2: { label: 'Renforcement progressif', desc: 'Après cicatrisation et feu vert du chirurgien : renforcement debout, petit matériel, cardio plus long.' },
    3: { label: 'Consolidation', desc: "Sangle abdominale et exercices au sol, uniquement avec l'accord explicite de ton équipe." },
  };

  const yt = (id) => `https://www.youtube.com/watch?v=${id}`;

  // Vidéos conseillées par le livret (liens vérifiés).
  const VIDEOS = [
    { cat: 'mobilite', url: yt('dLb5iSgEWpA'), title: '5 min pour réveiller son corps sur chaise' },
    { cat: 'haut', url: yt('4lzi53LAd-Q'), title: 'Renforcement musculaire complet sur chaise' },
    { cat: 'bas', url: yt('c1-KbhkGDwA'), title: 'Renforcement adapté et complet sur chaise' },
    { cat: 'abdo', url: yt('oqz32cm3XF0'), title: 'Abdominaux (APA)' },
    { cat: 'abdo', url: yt('lO8ek7PGD5U'), title: 'La planche (APA)' },
    { cat: 'abdo', url: yt('BNIzQlCCYiM'), title: 'Pont fessier (APA)' },
    { cat: 'abdo', url: yt('H9dkwi3037Y'), title: 'À quatre pattes (APA)' },
    { cat: 'cardio', url: yt('vBjVCZzBwzQ'), title: "Situations d'endurance" },
    { cat: 'souplesse', url: yt('XARg6j85V7g'), title: 'Étirements complets sur chaise (niveau 1)' },
  ];

  const LIVRET_TONICITE = '1 à 3 séries de 10 à 20 répétitions';
  const LIVRET_CARDIO = '1 à 3 séries · 1 à 3 min de repos entre chaque série';
  const LIVRET_SOUPLESSE = 'Maintenir la posture 10 à 30 secondes';
  const LEST_1_5 = 'Pour plus de contraction : ballons lestés de 1 à 5 kg, progressivement et selon tes capacités.';
  const BRACELETS = 'Pour plus de contraction : bracelets lestés aux chevilles.';

  const ex = (o) => ({
    mode: 'reps', sets: 2, setsMax: 3, reps: 10, repsMax: 20, duration: 30, durationMax: 30, rest: 45,
    perSide: false, side: 'côté', per: '', position: 'assis', equipment: [], phase: 1,
    steps: [], note: '', tip: '', progression: [], video: '',
    ...o,
    img: `img/exercices/${o.id}.jpg`,
    sheet: `img/fiches/${o.sheet}.jpg`,
  });

  const EXERCISES = [
    // ——— Fiche « Mes exercices bénéfiques » ———
    ex({
      id: 'equilibre-statique', name: 'Équilibre sur un pied', cat: 'equilibre', sheet: 'fiche-exercices-benefiques',
      objective: "Proprioception, renforcement de la jambe d'appui et de la sangle abdominale",
      position: 'debout', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 30, durationMax: 60, rest: 20, perSide: true, side: 'pied',
      dosage: "30 s par pied → 1 min par pied → 1 min sur un coussin. Idéalement 2 min par jour.",
      steps: ["Debout, à côté d'un appui stable (dossier de chaise, plan de travail).", 'Tiens en équilibre sur un pied, regard droit devant.', 'Change de pied.'],
      progression: ['30 secondes sur chaque pied', '1 minute sur chaque pied', "1 minute sur chaque pied, un coussin sous le pied d'appui"],
      note: 'Astuce du livret : pratique-le pendant le brossage des dents 🙂',
      tip: "Garde toujours un appui à portée de main. La perte de poids déplace ton centre de gravité : l'équilibre se réapprend progressivement.",
    }),
    ex({
      id: 'levers-chaise', name: 'Levers de chaise', cat: 'bas', sheet: 'fiche-exercices-benefiques',
      objective: 'Force des membres inférieurs (cuisses + fessiers)',
      position: 'assis', equipment: ['chaise'], phase: 2,
      sets: 3, setsMax: 5, reps: 10, repsMax: 20, rest: 45,
      dosage: '10 → 15 → 20 répétitions · 3 à 5 séries · 30 s à 1 min de repos · 3 fois par semaine (lun-mer-ven)',
      steps: ["Assis au bord d'une chaise stable, pieds à plat, écartés largeur de hanches.", 'Bras croisés sur le sternum (ou mains sur les cuisses).', "Lève-toi jusqu'à avoir les jambes tendues, puis rassieds-toi lentement.", 'Enchaîne le maximum de levers sur la série.'],
      progression: ['10 répétitions', '15 répétitions', '20 répétitions'],
      note: 'Tu peux compléter avec la chaise murale (gainage).',
      tip: "Chaise calée contre un mur. Genoux dans l'axe des pieds, souffle en te levant. Au début, aide-toi des mains sur les cuisses.",
    }),
    ex({
      id: 'chaise-murale', name: 'Chaise murale (gainage)', cat: 'bas', sheet: 'fiche-exercices-benefiques',
      objective: 'Gainage des cuisses en isométrie, en complément des levers de chaise',
      position: 'debout', equipment: ['mur'], phase: 2,
      mode: 'time', sets: 2, setsMax: 3, duration: 15, durationMax: 45, rest: 45,
      dosage: 'Complément des levers de chaise (photo 2 de la fiche). Commence par 10 à 15 s.',
      steps: ["Dos plaqué contre un mur, pieds avancés d'environ 50 cm.", "Descends en glissant le long du mur, sans dépasser l'angle droit aux genoux.", 'Tiens la position en respirant calmement.', 'Remonte en poussant sur les jambes.'],
      tip: 'Ne descends pas trop bas : mieux vaut un angle ouvert tenu sans douleur aux genoux. Ne bloque jamais ta respiration.',
    }),
    ex({
      id: 'pompes-mur', name: 'Pompes contre le mur', cat: 'haut', sheet: 'fiche-exercices-benefiques',
      objective: 'Force des membres supérieurs (bras, pectoraux, dos)',
      position: 'debout', equipment: ['mur'], phase: 2,
      sets: 3, setsMax: 5, reps: 10, repsMax: 20, rest: 45,
      dosage: '10 → 15 → 20 répétitions · 3 à 5 séries · 30 s à 1 min de repos · 3 fois par semaine',
      steps: ["Face au mur, bras tendus, mains à hauteur d'épaules, écartées comme les épaules.", 'Plie les coudes pour approcher le buste du mur, corps bien droit.', 'Pousse pour revenir bras tendus.'],
      progression: ['10 répétitions', '15 répétitions', '20 répétitions'],
      note: "Plus difficile : resserre l'écart des mains pour solliciter davantage pectoraux et triceps.",
      tip: 'Plus tes pieds sont proches du mur, plus c\'est facile : commence près. Souffle en poussant, ventre gainé sans forcer.',
    }),

    // ——— Mobilité articulaire (p. 11-12) ———
    ex({
      id: 'mob-poignets', name: 'Mobilité des poignets', cat: 'mobilite', sheet: 'p11-mobilite',
      objective: 'Mobilité articulaire des poignets', phase: 1,
      sets: 1, setsMax: 2, reps: 5, repsMax: 10, rest: 15, per: 'par sens',
      dosage: '5 répétitions par sens de rotation',
      steps: ['Joins tes mains et croise les doigts.', "Fais des rotations dans un sens, puis dans l'autre."],
      note: "Si tu n'y parviens pas, mobilise tes poignets l'un après l'autre (« les marionnettes »).",
      tip: "Mouvements lents et amples, sans douleur. Idéal pour s'échauffer.",
      video: yt('dLb5iSgEWpA'),
    }),
    ex({
      id: 'mob-colonne', name: 'Mobilité de la colonne', cat: 'mobilite', sheet: 'p11-mobilite',
      objective: 'Mobilité articulaire de la colonne vertébrale', phase: 1,
      sets: 1, setsMax: 2, reps: 10, repsMax: 10, rest: 15, per: 'par mouvement',
      dosage: '10 répétitions par mouvement',
      steps: ["Pieds écartés, dos droit, bras le long du corps : penche-toi d'un côté puis de l'autre.", "Même départ : penche-toi vers l'avant pour toucher le sol, tes pieds ou tes chevilles, puis reviens."],
      note: "Respire profondément et ne va jamais jusqu'à la douleur.",
      tip: "La flexion avant comprime le ventre : évite-la juste après un repas et limite l'amplitude les premières semaines.",
      video: yt('dLb5iSgEWpA'),
    }),
    ex({
      id: 'mob-hanches', name: 'Mobilité des hanches', cat: 'mobilite', sheet: 'p11-mobilite',
      objective: 'Mobilité articulaire des hanches', phase: 1,
      sets: 1, setsMax: 2, reps: 10, repsMax: 10, rest: 15, per: 'par jambe',
      dosage: '10 répétitions par mouvement',
      steps: ['Assis, lève la cuisse droite (monte le genou).', 'Reviens en position initiale.', 'Fais de même avec la cuisse gauche.'],
      note: "Variante : réalise le mouvement de manière latérale (genou vers l'extérieur).",
      tip: "Dos droit, sans t'affaisser. Garde une amplitude confortable.",
      video: yt('dLb5iSgEWpA'),
    }),
    ex({
      id: 'mob-genoux', name: 'Mobilité des genoux', cat: 'mobilite', sheet: 'p11-mobilite',
      objective: 'Mobilité articulaire des genoux', phase: 1,
      sets: 1, setsMax: 2, reps: 10, repsMax: 10, rest: 15, per: 'par jambe',
      dosage: '10 répétitions par mouvement',
      steps: ['Assis, tends la jambe droite devant toi sans surélever la cuisse.', 'Reviens en position initiale.', 'Fais de même avec la jambe gauche.'],
      tip: "Tends sans verrouiller brutalement le genou. Parfait pour préparer l'articulation avant la marche.",
      video: yt('dLb5iSgEWpA'),
    }),
    ex({
      id: 'mob-chevilles', name: 'Mobilité des chevilles', cat: 'mobilite', sheet: 'p12-mobilite',
      objective: 'Mobilité articulaire des chevilles', phase: 1,
      sets: 1, setsMax: 2, reps: 5, repsMax: 10, rest: 15, per: 'par sens et par pied',
      dosage: '5 répétitions par sens de rotation',
      steps: ['Tends la jambe droite et décolle le pied du sol.', "Fais tourner le pied dans le sens des aiguilles d'une montre, puis dans l'autre sens.", 'Fais de même avec la cheville gauche.'],
      tip: 'Favorise le retour veineux : utile aussi en cas de jambes lourdes.',
      video: yt('dLb5iSgEWpA'),
    }),

    // ——— Tonicité membres supérieurs (p. 13-14) ———
    ex({
      id: 'ballon-compression', name: 'Compression du ballon', cat: 'haut', sheet: 'p13-tonicite-haut',
      objective: 'Tonicité et endurance des pectoraux', equipment: ['ballon'], phase: 1,
      dosage: LIVRET_TONICITE,
      steps: ['Tiens le ballon entre tes paumes, à hauteur de poitrine, coudes écartés (bras parallèles au sol).', 'En expirant, comprime le ballon.', 'En inspirant, relâche la compression.'],
      note: 'Pour compléter : maintiens la contraction une dizaine de secondes avant de relâcher.',
      tip: 'Souffle à chaque compression : ne bloque jamais ta respiration, cela protège ta paroi abdominale.',
      video: yt('4lzi53LAd-Q'),
    }),
    ex({
      id: 'ballon-poussee', name: 'Poussée du ballon', cat: 'haut', sheet: 'p13-tonicite-haut',
      objective: 'Tonicité et endurance des pectoraux et des bras', equipment: ['ballon'], phase: 1,
      dosage: LIVRET_TONICITE,
      steps: ['Tiens le ballon entre tes paumes à hauteur de poitrine, coudes écartés.', "En expirant, tends les bras vers l'avant.", 'En inspirant, ramène le ballon contre ta poitrine.'],
      note: LEST_1_5,
      tip: "Sans charge les premières semaines, puis progresse 1 kg à la fois avec l'accord de ton équipe.",
      video: yt('4lzi53LAd-Q'),
    }),
    ex({
      id: 'ballon-tete', name: 'Ballon au-dessus de la tête', cat: 'haut', sheet: 'p14-tonicite-haut',
      objective: 'Tonicité et endurance des pectoraux, des bras et des épaules', equipment: ['ballon'], phase: 2,
      dosage: LIVRET_TONICITE,
      steps: ['Tiens le ballon entre tes paumes à hauteur de poitrine, coudes écartés.', 'En expirant, tends les bras vers le haut, au-dessus de la tête.', 'En inspirant, ramène le ballon contre ta poitrine.'],
      note: LEST_1_5,
      tip: 'Lever les bras étire la paroi abdominale : attends la bonne cicatrisation et arrête en cas de tiraillement.',
      video: yt('4lzi53LAd-Q'),
    }),
    ex({
      id: 'ballon-arriere', name: 'Ballon bras tendus vers l\'arrière', cat: 'haut', sheet: 'p14-tonicite-haut',
      objective: 'Tonicité et endurance des épaules et des dorsaux', equipment: ['ballon'], phase: 2,
      dosage: LIVRET_TONICITE,
      steps: ['Tiens le ballon entre tes paumes, bras tendus et parallèles au sol.', 'En expirant, lève les bras le plus haut et le plus en arrière possible, bras tendus.', 'En inspirant, ramène les bras en position initiale.'],
      note: 'Pour plus de contraction : ballons lestés de 1 à 3 kg, progressivement.',
      tip: 'Amplitude sans douleur aux épaules ; ne creuse pas le bas du dos.',
      video: yt('4lzi53LAd-Q'),
    }),
    ex({
      id: 'ballon-biceps', name: 'Flexion des bras avec ballon', cat: 'haut', sheet: 'p14-tonicite-haut',
      objective: 'Tonicité et endurance des bras (biceps / triceps)', equipment: ['ballon'], phase: 1,
      dosage: LIVRET_TONICITE,
      steps: ['Bras collés au buste, mains sous le ballon.', "En expirant, lève les avant-bras jusqu'à ce que le ballon touche ton menton.", 'En inspirant, ramène les avant-bras en position initiale.'],
      note: LEST_1_5,
      tip: 'Coudes fixes contre le corps, mouvement lent dans les deux sens.',
      video: yt('4lzi53LAd-Q'),
    }),

    // ——— Tonicité membres inférieurs (p. 15-16) ———
    ex({
      id: 'quadri-extension', name: 'Extension de jambe assis', cat: 'bas', sheet: 'p15-tonicite-bas',
      objective: 'Tonicité et endurance des quadriceps', equipment: ['chaise'], phase: 1, per: 'par jambe',
      dosage: `${LIVRET_TONICITE} par jambe`,
      steps: ['Assis confortablement, pieds au sol et parallèles.', "À l'expiration, tends la jambe.", "À l'inspiration, ramène la jambe en position initiale."],
      note: BRACELETS,
      tip: 'Exercice de reprise idéal : il renforce sans impact sur les genoux.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'quadri-genou', name: 'Montée de genou assis', cat: 'bas', sheet: 'p15-tonicite-bas',
      objective: 'Tonicité et endurance des quadriceps et fessiers', equipment: ['chaise'], phase: 1, per: 'par jambe',
      dosage: `${LIVRET_TONICITE} par jambe`,
      steps: ['Assis confortablement, pieds au sol et parallèles.', "À l'expiration, jambe fléchie, lève la jambe le plus haut possible.", "À l'inspiration, ramène la jambe en position initiale."],
      note: BRACELETS,
      tip: 'Dos droit contre le dossier, sans te pencher en arrière.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'pedalage-assis', name: 'Pédalage assis', cat: 'bas', sheet: 'p15-tonicite-bas',
      objective: 'Tonicité et endurance des quadriceps, fessiers et ischio-jambiers', equipment: ['chaise'], phase: 1, per: 'par jambe',
      dosage: `${LIVRET_TONICITE} par jambe`,
      steps: ['Assis confortablement, pieds au sol et parallèles.', 'Réalise un mouvement de pédalage avec une jambe, comme à vélo.'],
      note: BRACELETS,
      tip: 'Tiens-toi au siège si besoin. Rythme régulier, respiration fluide.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'quadri-2-jambes', name: 'Extension des deux jambes', cat: 'bas', sheet: 'p16-tonicite-bas',
      objective: 'Tonicité et endurance des quadriceps', equipment: ['chaise'], phase: 2,
      dosage: LIVRET_TONICITE,
      steps: ['Assis confortablement, pieds au sol et parallèles.', "À l'expiration, tends les 2 jambes.", "À l'inspiration, ramène les jambes en position initiale."],
      note: BRACELETS,
      tip: 'Plus exigeant pour le ventre : tiens-toi au siège et garde le dos contre le dossier.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'mollets-assis', name: 'Relevés de talons assis', cat: 'bas', sheet: 'p16-tonicite-bas',
      objective: 'Tonicité et endurance des mollets (jumeaux)', equipment: ['chaise'], phase: 1,
      dosage: LIVRET_TONICITE,
      steps: ['Assis confortablement, pieds au sol et parallèles.', "À l'expiration, décolle les talons du sol.", "À l'inspiration, repose les pieds."],
      note: "Pour plus de contraction : pose sur tes genoux un objet lesté (médecine-ball, bouteille d'eau).",
      tip: 'Favorise le retour veineux : utile aussi en cas de jambes lourdes.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'tibiaux-assis', name: 'Relevés de pointes de pieds', cat: 'bas', sheet: 'p16-tonicite-bas',
      objective: 'Tonicité et endurance des tibiaux et fibulaires', equipment: ['chaise'], phase: 1,
      dosage: LIVRET_TONICITE,
      steps: ['Assis confortablement, pieds au sol et parallèles.', "À l'expiration, décolle les pointes de pieds du sol.", "À l'inspiration, repose les pieds."],
      note: 'Contraction prolongée : tiens la posture une dizaine de secondes.',
      tip: 'Renforce les chevilles et aide à prévenir les chutes.',
      video: yt('c1-KbhkGDwA'),
    }),
    ex({
      id: 'jambes-maintien', name: 'Jambes tendues maintenues', cat: 'bas', sheet: 'p16-tonicite-bas',
      objective: 'Tonicité et résistance des quadriceps et ischio-jambiers', equipment: ['chaise'], phase: 2,
      mode: 'time', sets: 2, setsMax: 3, duration: 10, durationMax: 60, rest: 45,
      dosage: '1 à 3 séries de 10 à 60 secondes',
      steps: ['Assis confortablement, pieds au sol et parallèles.', "Tends les jambes pour qu'elles soient parallèles au sol.", 'Maintiens la posture le temps souhaité.'],
      note: "Plus difficile : décolle le dos du dossier et tends les bras vers l'avant.",
      tip: 'Commence par 10 s. Respire pendant tout le maintien : compte à voix haute si besoin.',
      video: yt('c1-KbhkGDwA'),
    }),

    // ——— Sangle abdominale (p. 18) ———
    ex({
      id: 'pedalage-sol-1', name: 'Pédalage allongé (une jambe)', cat: 'abdo', sheet: 'p18-sangle-abdo',
      objective: 'Tonicité des cuisses et des abdominaux', position: 'sol', equipment: ['tapis'], phase: 3, per: 'par jambe',
      dosage: `${LIVRET_TONICITE} par jambe`,
      steps: ['Allongé sur le dos, bras le long du corps, jambes fléchies sur le tapis.', 'Réalise un mouvement de pédalage avec une jambe.', 'Respiration fluide et non saccadée.'],
      note: 'Si douleur dans le bas du dos : place tes mains sous tes fesses ou glisse un coussin dans le creux du dos.',
      tip: "Sangle abdominale : uniquement après l'accord de ton chirurgien. Stoppe au moindre tiraillement des cicatrices.",
      video: yt('oqz32cm3XF0'),
    }),
    ex({
      id: 'pedalage-sol-2', name: 'Pédalage allongé (alterné)', cat: 'abdo', sheet: 'p18-sangle-abdo',
      objective: 'Tonicité des cuisses et des abdominaux', position: 'sol', equipment: ['tapis'], phase: 3,
      dosage: LIVRET_TONICITE,
      steps: ['Allongé sur le dos, bras le long du corps, jambes fléchies sur le tapis.', 'Réalise un mouvement de pédalage alterné avec les jambes.', 'Respiration fluide et non saccadée.'],
      note: 'Si douleur dans le bas du dos : place tes mains sous tes fesses ou glisse un coussin dans le creux du dos.',
      tip: "Sangle abdominale : uniquement après l'accord de ton chirurgien. Stoppe au moindre tiraillement des cicatrices.",
      video: yt('oqz32cm3XF0'),
    }),
    ex({
      id: 'pont-fessier', name: 'Pont fessier', cat: 'abdo', sheet: 'p18-sangle-abdo',
      objective: 'Tonicité des cuisses, des fessiers et des lombaires', position: 'sol', equipment: ['tapis'], phase: 2,
      dosage: LIVRET_TONICITE,
      steps: ['Allongé sur le dos, bras le long du corps, jambes fléchies sur le tapis.', 'En expirant, lève le bassin.', 'En inspirant, reviens en position initiale.'],
      note: 'Maintiens la posture plusieurs secondes pour compléter cet exercice.',
      tip: 'Monte le bassin sans creuser le dos. Pour te relever du sol, roule sur le côté puis pousse avec les bras : cela protège ta paroi abdominale.',
      video: yt('BNIzQlCCYiM'),
    }),

    // ——— Endurance cardio-respiratoire (p. 19-20) ———
    ex({
      id: 'marche-6min', name: 'Marche 6 minutes', cat: 'cardio', sheet: 'p19-cardio',
      objective: 'Endurance aérobie et endurance musculaire des jambes', position: 'debout', phase: 1,
      mode: 'time', sets: 1, setsMax: 3, duration: 360, durationMax: 360, rest: 120,
      dosage: LIVRET_CARDIO,
      steps: ['Marche pour parcourir la plus grande distance possible en 6 minutes.', 'Ou : fais des allers-retours entre 2 plots espacés de 20 mètres.'],
      note: "Pour davantage de contractions musculaires : augmente l'amplitude de tes pas.",
      tip: "Test de la parole : tu dois pouvoir parler (mais pas chanter). Bonnes chaussures, et petites gorgées d'eau ensuite.",
      video: yt('vBjVCZzBwzQ'),
    }),
    ex({
      id: 'montees-genoux', name: 'Montées de genoux', cat: 'cardio', sheet: 'p19-cardio',
      objective: 'Endurance aérobie et endurance musculaire des jambes', position: 'debout', phase: 1,
      mode: 'time', sets: 1, setsMax: 3, duration: 120, durationMax: 120, rest: 90,
      dosage: `2 minutes · ${LIVRET_CARDIO}`,
      steps: ['Monte les genoux par alternance en suivant un rythme modéré.', "Essaie de tenir l'effort pendant 2 minutes."],
      note: 'Possible en position assise si la station debout est impossible ou douloureuse.',
      tip: "Rythme modéré : pas besoin de monter haut. Reste près d'un appui.",
      video: yt('vBjVCZzBwzQ'),
    }),
    ex({
      id: 'step', name: 'Step', cat: 'cardio', sheet: 'p20-cardio',
      objective: 'Endurance aérobie et endurance musculaire des jambes', position: 'debout', equipment: ['step'], phase: 2,
      mode: 'time', sets: 1, setsMax: 3, duration: 180, durationMax: 180, rest: 90,
      dosage: `3 minutes · ${LIVRET_CARDIO}`,
      steps: ['Monte et descends du step en suivant un rythme modéré.', "Essaie de tenir l'effort pendant 3 minutes.", "Recommence après 1 à 3 min de repos en changeant de pied d'appui."],
      note: 'Pour ne pas avoir les yeux rivés sur le chrono : choisis une chanson de 3 minutes environ.',
      tip: 'Marche basse (10 à 15 cm) pour ménager genoux et chevilles. Pose tout le pied sur le step.',
      video: yt('vBjVCZzBwzQ'),
    }),
    ex({
      id: 'cerceau', name: 'Déplacements dans un cerceau', cat: 'equilibre', sheet: 'p20-cardio',
      objective: 'Endurance aérobie, équilibre et coordination', position: 'debout', equipment: ['cerceau'], phase: 2,
      mode: 'time', sets: 1, setsMax: 3, duration: 120, durationMax: 120, rest: 90,
      dosage: `2 minutes · ${LIVRET_CARDIO}`,
      steps: ['Debout dans un cerceau.', 'Déplace-toi : devant-dedans, derrière-dedans, à droite-dedans, à gauche-dedans, et ainsi de suite.', "Reproduis l'effort pendant 2 minutes."],
      note: 'Plus de coordination : tape dans tes mains chaque fois que tu reviens dans le cerceau.',
      tip: 'Pas de cerceau ? Trace un carré au sol avec du ruban adhésif. Commence lentement.',
      video: yt('vBjVCZzBwzQ'),
    }),
    ex({
      id: 'bras-jambes', name: 'Enchaînement bras-jambes', cat: 'cardio', sheet: 'p20-cardio',
      objective: 'Endurance aérobie et endurance musculaire générale', position: 'debout', phase: 2,
      mode: 'time', sets: 1, setsMax: 3, duration: 180, durationMax: 300, rest: 90,
      dosage: `Environ 5 minutes · ${LIVRET_CARDIO}`,
      steps: ['Sur place, enchaîne des mouvements qui sollicitent les bras et les jambes par alternance.', 'Au moins 10 répétitions par mouvement.', "Tiens l'effort environ 5 minutes."],
      note: 'Possible en position assise si la station debout est impossible ou douloureuse.',
      tip: 'Commence par 2 à 3 min et allonge progressivement. Pas de sauts : tes articulations te remercieront.',
      video: yt('vBjVCZzBwzQ'),
    }),

    // ——— Souplesse (p. 21-23) ———
    ex({
      id: 'etir-bras-epaules', name: 'Étirement bras et épaules', cat: 'souplesse', sheet: 'p21-souplesse',
      objective: 'Souplesse des bras et des épaules', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10,
      dosage: LIVRET_SOUPLESSE,
      steps: ['Assis sur une chaise, dos droit, jambes fléchies.', "Tends les bras vers l'avant, une main sur l'autre.", "À l'expiration, emmène les bras le plus en arrière possible. Maintiens en respirant profondément.", 'En expirant lentement, reviens en position initiale.'],
      tip: 'Étirement doux : sans à-coups, ni douleur.',
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-triceps', name: 'Étirement des triceps', cat: 'souplesse', sheet: 'p21-souplesse',
      objective: 'Souplesse des triceps', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10, perSide: true, side: 'bras',
      dosage: LIVRET_SOUPLESSE,
      steps: ['Assis sur une chaise, dos droit, jambes fléchies.', "Pose la main droite sur l'omoplate gauche (coude vers le plafond). Avec la main gauche, appuie sur le coude droit pour aider la main à descendre. Maintiens en respirant profondément.", 'En expirant lentement, reviens puis change de bras.'],
      tip: 'Garde la tête droite et les épaules basses.',
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-pectoraux', name: 'Étirement des pectoraux', cat: 'souplesse', sheet: 'p22-souplesse',
      objective: 'Souplesse des pectoraux', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10,
      dosage: LIVRET_SOUPLESSE,
      steps: ['Assis sur une chaise, dos droit, jambes fléchies.', 'Bras devant toi, mains et avant-bras qui se touchent (bras fléchis).', "À l'expiration, écarte les bras et emmène-les le plus possible vers l'arrière. Maintiens en respirant profondément.", 'En expirant lentement, reviens en position initiale.'],
      tip: 'Ouvre la poitrine sans creuser le bas du dos.',
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-tronc', name: 'Étirement du tronc', cat: 'souplesse', sheet: 'p22-souplesse',
      objective: 'Souplesse du tronc', equipment: ['chaise'], phase: 2,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10,
      dosage: LIVRET_SOUPLESSE,
      steps: ["Assis au bord d'une chaise, jambes fléchies et pieds écartés.", "Penche-toi vers l'avant pour que tes mains touchent le sol (pieds ou chevilles). Rentre la tête entre les épaules. Maintiens en respirant profondément.", 'En expirant lentement, reviens en position initiale.'],
      tip: 'Cette posture comprime le ventre : évite-la après un repas et les premières semaines. Redresse-toi lentement pour éviter la tête qui tourne.',
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-fessiers-psoas', name: 'Étirement fessiers et psoas', cat: 'souplesse', sheet: 'p22-souplesse',
      objective: 'Souplesse des fessiers et du psoas', equipment: ['chaise'], phase: 2,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10, perSide: true, side: 'jambe',
      dosage: LIVRET_SOUPLESSE,
      steps: ["Assis au bord d'une chaise, dos reposé sur le dossier.", 'Attrape ton genou et ramène-le vers la poitrine. Maintiens en respirant profondément.', 'En expirant lentement, reviens puis change de jambe.'],
      tip: "Le genou vers la poitrine appuie sur le ventre : n'insiste pas, reste dans une amplitude confortable.",
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-quadriceps', name: 'Étirement des quadriceps', cat: 'souplesse', sheet: 'p23-souplesse',
      objective: 'Souplesse des quadriceps', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10, perSide: true, side: 'jambe',
      dosage: LIVRET_SOUPLESSE,
      steps: ["Assis sur le bord d'une chaise, dos bien droit : une jambe tendue talon au sol, l'autre pliée, pointe de pied sous la chaise.", 'Incline le dos en arrière (contre le dossier) en te tenant à la chaise. Maintiens en respirant profondément.', 'En expirant, reviens puis change de jambe.'],
      tip: "Chaise stable, sans roulettes. Tension légère à l'avant de la cuisse, jamais dans le genou.",
      video: yt('XARg6j85V7g'),
    }),
    ex({
      id: 'etir-mollets-ischios', name: 'Étirement mollets et ischios', cat: 'souplesse', sheet: 'p23-souplesse',
      objective: 'Souplesse des mollets et des ischio-jambiers', equipment: ['chaise'], phase: 1,
      mode: 'time', sets: 1, setsMax: 2, duration: 20, durationMax: 30, rest: 10, perSide: true, side: 'jambe',
      dosage: LIVRET_SOUPLESSE,
      steps: ["Assis au bord d'une chaise, dos droit.", "Tends une jambe vers l'avant, orteils vers le plafond.", "En expirant lentement, penche-toi vers l'avant, dos droit et fesses sur la chaise, la main opposée en appui sur le genou fléchi. Maintiens en respirant profondément.", 'En expirant, reviens puis change de jambe.'],
      tip: "Dos droit plutôt que d'aller loin : l'étirement doit rester confortable.",
      video: yt('XARg6j85V7g'),
    }),
  ];

  // Ateliers proposés au premier lancement (modifiables ou supprimables).
  const DEFAULT_WORKOUTS = [
    { id: 'w-reveil', name: 'Réveil articulaire', emoji: '🌅', items: ['mob-poignets', 'mob-colonne', 'mob-hanches', 'mob-genoux', 'mob-chevilles'] },
    { id: 'w-jambes', name: 'Jambes sur chaise', emoji: '🪑', items: ['mob-chevilles', 'quadri-extension', 'quadri-genou', 'mollets-assis', 'tibiaux-assis', 'pedalage-assis'] },
    { id: 'w-haut', name: 'Haut du corps au ballon', emoji: '💪', items: ['mob-poignets', 'ballon-compression', 'ballon-poussee', 'ballon-biceps', 'etir-pectoraux'] },
    { id: 'w-cardio', name: 'Cardio doux', emoji: '❤️', items: ['mob-chevilles', 'mob-genoux', 'montees-genoux', 'marche-6min', 'etir-mollets-ischios'] },
    { id: 'w-soir', name: 'Étirements du soir', emoji: '🌙', items: ['etir-bras-epaules', 'etir-triceps', 'etir-pectoraux', 'etir-quadriceps', 'etir-mollets-ischios'] },
    { id: 'w-fiche', name: 'Mes exercices bénéfiques', emoji: '⭐', items: ['equilibre-statique', 'levers-chaise', 'chaise-murale', 'pompes-mur'] },
  ];

  window.BM_DATA = { CATEGORIES, PHASES, VIDEOS, EXERCISES, DEFAULT_WORKOUTS };
})();
