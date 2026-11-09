/* Cap — base nutritionnelle locale.
 * Valeurs pour 100 g (boissons : 100 ml), arrondies, d'après les ordres de grandeur des tables publiques
 * (Ciqual/ANSES, USDA). Précision typique ±10 à 15 % selon la marque et la recette. Les plats composés
 * (fast-food, cantine) sont des estimations moyennes, signalées « est. ».
 * Colonnes : id, nom, catégorie, kcal, protéines, glucides, lipides, portion (g), libellé de portion, étiquettes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CapFoods = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const R = [
    // Féculents et céréales
    ['riz-cru', 'Riz blanc (cru)', 'Féculents', 356, 7, 79, 0.6, 80, '1 portion', ''],
    ['riz-cuit', 'Riz blanc (cuit)', 'Féculents', 130, 2.7, 28, 0.3, 180, '1 assiette', ''],
    ['pates-crues', 'Pâtes (crues)', 'Féculents', 357, 12.5, 71, 1.5, 100, '1 portion', ''],
    ['pates-cuites', 'Pâtes (cuites)', 'Féculents', 150, 5.3, 30, 0.9, 220, '1 assiette', ''],
    ['baguette', 'Pain baguette', 'Féculents', 270, 9, 55, 1.2, 40, '1 morceau', ''],
    ['pain-complet', 'Pain complet', 'Féculents', 245, 9, 45, 2.5, 40, '1 tranche épaisse', ''],
    ['pain-mie', 'Pain de mie', 'Féculents', 265, 8, 49, 3.5, 25, '1 tranche', ''],
    ['avoine', 'Flocons d’avoine', 'Féculents', 370, 13, 60, 7, 60, '1 bol', ''],
    ['pdt', 'Pomme de terre cuite à l’eau', 'Féculents', 80, 2, 17, 0.1, 200, '2 moyennes', ''],
    ['frites', 'Frites', 'Féculents', 290, 3.4, 36, 14, 150, '1 portion', ''],
    ['patate-douce', 'Patate douce (cuite)', 'Féculents', 86, 1.6, 20, 0.1, 200, '1 portion', ''],
    ['quinoa', 'Quinoa (cuit)', 'Féculents', 120, 4.4, 21, 1.9, 150, '1 portion', ''],
    ['semoule', 'Semoule (cuite)', 'Féculents', 112, 3.8, 23, 0.2, 150, '1 portion', ''],
    ['lentilles', 'Lentilles (cuites)', 'Légumineuses', 116, 9, 17, 0.4, 200, '1 portion', 'vegan'],
    ['pois-chiches', 'Pois chiches (cuits)', 'Légumineuses', 139, 7.4, 20, 2.4, 150, '1 portion', 'vegan'],
    ['haricots-rouges', 'Haricots rouges (cuits)', 'Légumineuses', 112, 8, 15, 0.5, 150, '1 portion', 'vegan'],
    ['cereales', 'Céréales du petit-déjeuner', 'Féculents', 380, 7, 84, 1, 40, '1 bol', ''],
    ['muesli', 'Muesli', 'Féculents', 370, 10, 63, 6, 50, '1 bol', ''],
    ['galette-riz', 'Galette de riz soufflé', 'Féculents', 385, 8, 81, 3, 9, '1 galette', ''],
    ['tortilla', 'Tortilla de blé', 'Féculents', 310, 8, 52, 7.5, 60, '1 tortilla', ''],
    // Viandes, poissons, œufs
    ['poulet-cru', 'Blanc de poulet (cru)', 'Viandes', 110, 23, 0, 1.5, 150, '1 filet', 'viande'],
    ['poulet-cuit', 'Blanc de poulet (cuit)', 'Viandes', 150, 31, 0, 2.5, 120, '1 filet', 'viande'],
    ['cuisse-poulet', 'Cuisse de poulet (cuite)', 'Viandes', 210, 26, 0, 11, 150, '1 cuisse', 'viande'],
    ['dinde', 'Escalope de dinde (crue)', 'Viandes', 105, 24, 0, 1, 150, '1 escalope', 'viande'],
    ['steak-5', 'Steak haché 5 % (cru)', 'Viandes', 125, 21, 0, 5, 125, '1 steak', 'viande'],
    ['steak-15', 'Steak haché 15 % (cru)', 'Viandes', 210, 18, 0, 15, 125, '1 steak', 'viande'],
    ['rumsteak', 'Rumsteak de bœuf (cru)', 'Viandes', 120, 22, 0, 3.5, 150, '1 pièce', 'viande'],
    ['jambon', 'Jambon blanc', 'Viandes', 115, 20, 1, 3.5, 40, '1 tranche', 'viande porc'],
    ['jambon-dinde', 'Blanc de dinde (charcuterie)', 'Viandes', 105, 20, 1.5, 2, 40, '1 tranche', 'viande'],
    ['lardons', 'Lardons', 'Viandes', 270, 15, 0.5, 23, 50, '1 portion', 'viande porc'],
    ['saucisse', 'Saucisse de porc', 'Viandes', 280, 14, 1, 25, 100, '1 saucisse', 'viande porc'],
    ['merguez', 'Merguez', 'Viandes', 300, 15, 2, 26, 70, '1 merguez', 'viande'],
    ['saumon', 'Saumon (cru)', 'Poissons', 200, 20, 0, 13, 125, '1 pavé', 'poisson'],
    ['thon', 'Thon au naturel (égoutté)', 'Poissons', 115, 26, 0, 1, 140, '1 boîte', 'poisson'],
    ['cabillaud', 'Cabillaud (cru)', 'Poissons', 80, 18, 0, 0.7, 150, '1 filet', 'poisson'],
    ['crevettes', 'Crevettes (cuites)', 'Poissons', 95, 21, 0, 1.2, 100, '1 portion', 'poisson'],
    ['sardines', 'Sardines à l’huile (égouttées)', 'Poissons', 220, 24, 0, 14, 85, '1 boîte', 'poisson'],
    ['surimi', 'Surimi', 'Poissons', 105, 8, 15, 1, 60, '4 bâtonnets', 'poisson'],
    ['oeuf', 'Œuf', 'Œufs', 140, 12.5, 0.5, 10, 60, '1 œuf', 'oeuf'],
    ['blanc-oeuf', 'Blanc d’œuf', 'Œufs', 48, 11, 0.7, 0, 33, '1 blanc', 'oeuf'],
    ['tofu', 'Tofu nature', 'Végétal', 120, 13, 1.5, 7, 100, '1 portion', 'vegan'],
    // Produits laitiers
    ['lait-demi', 'Lait demi-écrémé', 'Laitiers', 46, 3.3, 4.8, 1.6, 250, '1 bol (250 ml)', 'lait'],
    ['lait-entier', 'Lait entier', 'Laitiers', 64, 3.3, 4.8, 3.6, 250, '1 bol (250 ml)', 'lait'],
    ['lait-soja', 'Boisson au soja', 'Végétal', 40, 3.3, 2, 1.8, 250, '1 bol (250 ml)', 'vegan'],
    ['skyr', 'Skyr nature', 'Laitiers', 60, 10, 4, 0.2, 150, '1 pot', 'lait'],
    ['fb0', 'Fromage blanc 0 %', 'Laitiers', 47, 7.5, 4, 0.2, 100, '1 portion', 'lait'],
    ['fb3', 'Fromage blanc 3 %', 'Laitiers', 75, 7, 4, 3.2, 100, '1 portion', 'lait'],
    ['yaourt', 'Yaourt nature', 'Laitiers', 50, 4.3, 5, 1.2, 125, '1 pot', 'lait'],
    ['yaourt-grec', 'Yaourt à la grecque', 'Laitiers', 125, 5, 4, 10, 150, '1 pot', 'lait'],
    ['emmental', 'Emmental', 'Laitiers', 380, 28, 0, 30, 30, '1 portion', 'lait'],
    ['mozzarella', 'Mozzarella', 'Laitiers', 250, 18, 1, 19, 60, '½ boule', 'lait'],
    ['camembert', 'Camembert', 'Laitiers', 290, 20, 0.5, 23, 30, '1 portion', 'lait'],
    ['beurre', 'Beurre', 'Matières grasses', 745, 0.7, 0.6, 82, 10, '1 noisette', 'lait'],
    ['creme', 'Crème fraîche 30 %', 'Laitiers', 300, 2.3, 3, 30, 30, '2 c. à soupe', 'lait'],
    ['whey', 'Protéine en poudre (whey)', 'Laitiers', 380, 78, 8, 5, 30, '1 dose', 'lait'],
    // Fruits
    ['banane', 'Banane', 'Fruits', 90, 1.1, 20, 0.3, 120, '1 banane', 'vegan'],
    ['pomme', 'Pomme', 'Fruits', 53, 0.3, 12, 0.2, 150, '1 pomme', 'vegan'],
    ['orange', 'Orange', 'Fruits', 45, 0.9, 9, 0.2, 150, '1 orange', 'vegan'],
    ['fraises', 'Fraises', 'Fruits', 33, 0.7, 6, 0.3, 150, '1 barquette', 'vegan'],
    ['raisin', 'Raisin', 'Fruits', 70, 0.7, 16, 0.2, 125, '1 grappe', 'vegan'],
    ['kiwi', 'Kiwi', 'Fruits', 60, 1, 11, 0.5, 75, '1 kiwi', 'vegan'],
    ['avocat', 'Avocat', 'Fruits', 160, 2, 1.5, 15, 100, '½ avocat', 'vegan'],
    ['dattes', 'Dattes', 'Fruits', 285, 2.5, 64, 0.4, 24, '3 dattes', 'vegan'],
    ['compote', 'Compote sans sucre ajouté', 'Fruits', 55, 0.3, 12, 0.1, 100, '1 gourde', 'vegan'],
    // Légumes
    ['legumes', 'Légumes variés (cuits)', 'Légumes', 30, 1.8, 4, 0.3, 200, '1 portion', 'vegan'],
    ['brocoli', 'Brocoli (cuit)', 'Légumes', 35, 2.8, 4, 0.4, 200, '1 portion', 'vegan'],
    ['haricots-verts', 'Haricots verts (cuits)', 'Légumes', 30, 2, 4, 0.2, 200, '1 portion', 'vegan'],
    ['carottes', 'Carottes', 'Légumes', 36, 0.8, 7, 0.2, 100, '1 portion', 'vegan'],
    ['tomate', 'Tomate', 'Légumes', 18, 0.9, 3, 0.2, 120, '1 tomate', 'vegan'],
    ['salade', 'Salade verte', 'Légumes', 15, 1.3, 1.5, 0.2, 50, '1 bol', 'vegan'],
    ['concombre', 'Concombre', 'Légumes', 13, 0.6, 2, 0.1, 100, '½ concombre', 'vegan'],
    ['courgette', 'Courgette (cuite)', 'Légumes', 18, 1.2, 2.5, 0.3, 200, '1 portion', 'vegan'],
    ['poivron', 'Poivron', 'Légumes', 30, 1, 5, 0.3, 100, '½ poivron', 'vegan'],
    ['champignons', 'Champignons', 'Légumes', 25, 3, 1, 0.3, 100, '1 portion', 'vegan'],
    ['mais', 'Maïs doux', 'Légumes', 95, 3, 16, 1.5, 80, '1 petite boîte', 'vegan'],
    ['petits-pois', 'Petits pois (cuits)', 'Légumes', 80, 5.5, 10, 0.5, 150, '1 portion', 'vegan'],
    // Matières grasses et oléagineux
    ['huile', 'Huile d’olive', 'Matières grasses', 900, 0, 0, 100, 10, '1 c. à soupe', 'vegan'],
    ['amandes', 'Amandes', 'Oléagineux', 620, 21, 7, 52, 20, '1 poignée', 'vegan'],
    ['cajou', 'Noix de cajou', 'Oléagineux', 590, 18, 26, 46, 20, '1 poignée', 'vegan'],
    ['noix', 'Noix', 'Oléagineux', 690, 15, 7, 65, 20, '1 poignée', 'vegan'],
    ['beurre-cacahuete', 'Beurre de cacahuète', 'Oléagineux', 620, 25, 15, 50, 15, '1 c. à soupe', 'vegan'],
    // Plats et restauration (estimations)
    ['pizza', 'Pizza margherita (est.)', 'Plats', 250, 11, 30, 9, 200, '½ pizza', 'lait'],
    ['burger', 'Burger (est.)', 'Plats', 260, 13, 25, 12, 220, '1 burger', 'viande lait'],
    ['kebab', 'Kebab sandwich (est.)', 'Plats', 230, 12, 22, 11, 350, '1 kebab', 'viande'],
    ['tacos', 'Tacos français (est.)', 'Plats', 250, 10, 25, 12, 450, '1 tacos M', 'viande lait'],
    ['maki', 'Makis (est.)', 'Plats', 150, 5, 28, 2, 160, '6 makis', 'poisson'],
    ['croque', 'Croque-monsieur (est.)', 'Plats', 260, 13, 22, 13, 150, '1 croque', 'viande porc lait'],
    ['quiche', 'Quiche lorraine (est.)', 'Plats', 270, 9, 17, 19, 150, '1 part', 'viande porc lait oeuf'],
    ['lasagnes', 'Lasagnes bolognaise (est.)', 'Plats', 150, 8, 13, 7, 300, '1 part', 'viande lait'],
    ['couscous', 'Couscous viande (est.)', 'Plats', 140, 8, 15, 5, 400, '1 assiette', 'viande'],
    ['salade-composee', 'Salade composée (est.)', 'Plats', 110, 5, 8, 6, 300, '1 bol', ''],
    ['jambon-beurre', 'Sandwich jambon-beurre (est.)', 'Plats', 280, 11, 35, 10, 200, '1 sandwich', 'viande porc lait'],
    ['nuggets', 'Nuggets de poulet (est.)', 'Plats', 270, 15, 17, 16, 120, '6 nuggets', 'viande'],
    ['cantine', 'Repas de cantine complet (est.)', 'Plats', 130, 6, 15, 4.5, 500, '1 plateau', ''],
    // Boissons
    ['soda', 'Soda sucré', 'Boissons', 42, 0, 10.6, 0, 330, '1 canette', 'vegan'],
    ['soda-zero', 'Soda zéro', 'Boissons', 1, 0, 0, 0, 330, '1 canette', 'vegan'],
    ['jus-orange', 'Jus d’orange', 'Boissons', 45, 0.7, 10, 0.1, 250, '1 verre', 'vegan'],
    ['energisante', 'Boisson énergisante', 'Boissons', 45, 0, 11, 0, 250, '1 canette', 'vegan'],
    ['cafe', 'Café noir', 'Boissons', 2, 0.1, 0, 0, 100, '1 tasse', 'vegan'],
    // Sucré, snacks
    ['choco-noir', 'Chocolat noir 70 %', 'Sucré', 580, 8, 33, 43, 20, '2 carrés', 'vegan'],
    ['choco-lait', 'Chocolat au lait', 'Sucré', 540, 7, 57, 31, 20, '2 carrés', 'lait'],
    ['biscuits', 'Biscuits secs', 'Sucré', 440, 7, 74, 12, 25, '3 biscuits', ''],
    ['pate-tartiner', 'Pâte à tartiner noisette', 'Sucré', 540, 6, 57, 31, 15, '1 c. à soupe', 'lait'],
    ['croissant', 'Croissant', 'Sucré', 410, 8, 45, 21, 60, '1 croissant', 'lait'],
    ['pain-choc', 'Pain au chocolat', 'Sucré', 420, 7.5, 46, 22, 70, '1 pain au chocolat', 'lait'],
    ['glace', 'Glace', 'Sucré', 200, 3.5, 24, 10, 100, '2 boules', 'lait'],
    ['miel', 'Miel', 'Sucré', 320, 0.4, 80, 0, 15, '1 c. à soupe', ''],
    ['confiture', 'Confiture', 'Sucré', 245, 0.4, 60, 0, 20, '1 c. à soupe', 'vegan'],
    ['sucre', 'Sucre', 'Sucré', 400, 0, 100, 0, 5, '1 morceau', 'vegan'],
    ['chips', 'Chips', 'Sucré', 530, 6.5, 50, 33, 30, '1 petit paquet', 'vegan']
  ];
  const BASE = R.map(r => ({ id: r[0], n: r[1], cat: r[2], k: r[3], p: r[4], c: r[5], f: r[6], portion: r[7], portionLabel: r[8], tags: r[9] ? r[9].split(' ') : [], src: 'base' }));
  const REGIMES = {
    omnivore: ['Je mange de tout', []],
    sans_porc: ['Sans porc', ['porc']],
    halal: ['Halal', ['porc']],
    vegetarien: ['Végétarien', ['viande', 'porc', 'poisson']],
    vegetalien: ['Végétalien', ['viande', 'porc', 'poisson', 'lait', 'oeuf']],
    sans_lactose: ['Sans lactose', ['lait']]
  };
  function compatible(al, regime) {
    const ex = (REGIMES[regime] || REGIMES.omnivore)[1];
    return !(al.tags || []).some(t => ex.indexOf(t) >= 0);
  }
  const plain = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/[^a-z0-9 ]/g, ' ');
  function chercher(q, liste, regime) {
    const t = plain(q).trim().split(/\s+/).filter(Boolean);
    return liste.filter(al => compatible(al, regime)).map(al => {
      const n = plain(al.n);
      if (!t.length) return { al, s: 0 };
      let s = 0;
      for (const w of t) { const i = n.indexOf(w); if (i < 0) return null; s += i === 0 || n[i - 1] === ' ' ? 2 : 1; }
      return { al, s };
    }).filter(Boolean).sort((a, b) => b.s - a.s || a.al.n.localeCompare(b.al.n, 'fr')).map(x => x.al);
  }
  function parNom(nom) { const p = plain(nom).trim(); return BASE.find(al => plain(al.n).trim() === p) || null; }
  return { BASE, REGIMES, compatible, chercher, parNom, plain };
});
