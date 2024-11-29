import { randomBytes } from 'crypto';
/**
 * Génère une chaîne de lettres aléatoires de manière sécurisée.
 * @param length Le nombre de lettres à générer. Par défaut, 3.
 * @returns Une chaîne de lettres aléatoires.
 */
export const GenerateRadomLetters = (length = 3) => {
    const lettres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const lettresLength = lettres.length;
    let resultat = '';
    while (resultat.length < length) {
        // Génère un octet aléatoire
        const buffer = randomBytes(1);
        const valeur = buffer[0];
        // Évite le biais modulo en n'utilisant que les valeurs qui peuvent être réparties équitablement
        if (valeur < Math.floor(256 / lettresLength) * lettresLength) {
            resultat += lettres[valeur % lettresLength];
        }
    }
    return resultat;
};
