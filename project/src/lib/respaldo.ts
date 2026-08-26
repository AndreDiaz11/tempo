import RNFS from 'react-native-fs';
import { pick, keepLocalCopy, saveDocuments, types } from '@react-native-documents/picker';
import { Item, Respaldo, Subscription } from '../types';
import { normalizeItem, normalizeSubscription, todayKey } from '../lib/tempoLogic';

export async function exportarJson(items: Item[], subscriptions: Subscription[]): Promise<void> {
  const respaldo: Respaldo = {
    app: 'Tempo',
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
    subscriptions,
  };
  const contenido = JSON.stringify(respaldo, null, 2);
  const nombre = `tempo-respaldo-${todayKey()}.json`;
  const rutaTemporal = `${RNFS.CachesDirectoryPath}/${nombre}`;

  await RNFS.writeFile(rutaTemporal, contenido, 'utf8');
  try {
    await saveDocuments({
      sourceUris: [`file://${rutaTemporal}`],
      mimeType: 'application/json',
      fileName: nombre,
    });
  } finally {
    RNFS.unlink(rutaTemporal).catch(() => {});
  }
}

export interface PreviaImportacion {
  items: Item[];
  subscriptions: Subscription[];
  numItems: number;
  numSubscriptions: number;
}

export async function elegirYLeerRespaldo(): Promise<PreviaImportacion | null> {
  const [archivo] = await pick({ type: [types.json, types.allFiles] });
  if (!archivo) return null;

  const [copia] = await keepLocalCopy({
    files: [{ uri: archivo.uri, fileName: archivo.name ?? 'respaldo.json' }],
    destination: 'cachesDirectory',
  });
  if (copia.status !== 'success') {
    throw new Error('No se pudo leer el archivo elegido');
  }

  const contenido = await RNFS.readFile(copia.localUri, 'utf8');
  const parsed = JSON.parse(contenido);
  const rawItems = Array.isArray(parsed) ? parsed : parsed.items;
  if (!Array.isArray(rawItems)) throw new Error('Respaldo inválido');

  const items = rawItems.map(normalizeItem);
  const subscriptions = Array.isArray(parsed.subscriptions) ? parsed.subscriptions.map(normalizeSubscription) : [];

  return { items, subscriptions, numItems: items.length, numSubscriptions: subscriptions.length };
}
