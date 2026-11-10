/* Cap — configuration publique de la synchronisation.
 * Vide = mode sans compte (données sur cet appareil uniquement).
 * À remplir APRÈS création du projet Supabase (voir dev/docs/DEPLOYMENT_GUIDE.md, partie Supabase) :
 *  - supabaseUrl : adresse du projet, ex. https://abcd1234.supabase.co
 *  - supabaseAnonKey : clé PUBLIQUE « anon » ou « publishable » (sb_publishable_…). Elle est faite pour être
 *    dans le navigateur ; la protection vient des règles RLS. Ne JAMAIS mettre ici la clé « service_role »
 *    ou « secret » (sb_secret_…), ni une clé d'API IA.
 *  - ia : true seulement quand la fonction serveur cap-ai est déployée avec sa clé secrète. */
window.CAP_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
  ia: false,
  inscriptionOuverte: false
};
