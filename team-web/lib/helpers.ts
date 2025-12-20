import { Leader, Player } from '../types';

// Esta función convierte los Timestamps de Firebase (que no son JSON) 
// en strings legibles para que Next.js pueda manejarlos.
export function serializeTimestamp(data: any): any {
    if (!data) return data;

    // Si es un Timestamp, conviértelo
    if (data.toDate && typeof data.toDate === 'function') {
        return data.toDate().toISOString();
    }

    // Si es un array, itera sobre él
    if (Array.isArray(data)) {
        return data.map(serializeTimestamp);
    }

    // Si es un objeto, itera sobre sus propiedades
    if (typeof data === 'object' && data !== null) {
        const serializedObject: any = {};
        for (const key in data) {
            serializedObject[key] = serializeTimestamp(data[key]);
        }
        return serializedObject;
    }

    // Si no es nada de lo anterior, devuélvelo tal cual
    return data;
}

export const calculateAvg = (hits: number, ab: number): string => {
    const avg = ab > 0 ? (hits / ab) : 0;
    return avg.toFixed(3).toString().replace(/^0/, ''); // Devuelve ".333"
};

export const calculateOBP = (hits: number, ab: number, bb: number, hbp: number, sf: number): string => {
    const denominator = ab + bb + hbp + sf;
    const obp = denominator > 0 ? (hits + bb + hbp) / denominator : 0;
    return obp.toFixed(3).replace(/^0/, '');
};

export const calculateSLG = (hits: number, ab: number, doubles: number, triples: number, hr: number): string => {
    const singles = hits - (doubles + triples + hr);
    const totalBases = singles + (2 * doubles) + (3 * triples) + (4 * hr);
    const slg = ab > 0 ? totalBases / ab : 0;
    return slg.toFixed(3).replace(/^0/, '');
};

export const calculateOPS = (hits: number, ab: number, bb: number, hbp: number, sf: number, doubles: number, triples: number, hr: number): string => {
    const obp = parseFloat(calculateOBP(hits, ab, bb, hbp, sf));
    const slg = parseFloat(calculateSLG(hits, ab, doubles, triples, hr));
    const ops = obp + slg;
    return ops.toFixed(3).replace(/^0/, '');
};

// Función para encontrar los líderes de una estadística
export const getLeaders = (statName: string, playersList: Player[], statAccessor: (p: Player) => number, isAvg: boolean = false): Leader => {
    if (playersList.length === 0) {
        return { stat: statName, name: "N/A", value: isAvg ? ".000" : 0 };
    }

    // Ordenar jugadores por la estadística
    const sorted = [...playersList].sort((a, b) => (statAccessor(b) || 0) - (statAccessor(a) || 0));

    const maxValue = statAccessor(sorted[0]) || 0;
    if (maxValue === 0 && !isAvg) {
        return { stat: statName, name: "N/A", value: 0 };
    }

    // Encontrar a todos los jugadores empatados en el primer lugar
    const leaders = sorted.filter(p => (statAccessor(p) || 0) === maxValue);
    const names = leaders.map(l => l.playerName || l.name).join(", ");

    const displayValue = isAvg ? calculateAvg(leaders[0].hits, leaders[0].ab) : maxValue;

    return {
        stat: statName,
        name: names,
        value: displayValue,
        player: leaders[0]
    };
};
