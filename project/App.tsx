import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTempoStore } from './src/store/tempoStore';
import { SplashScreen } from './src/screens/SplashScreen';
import { ImportarScreen } from './src/screens/ImportarScreen';
import { PrincipalScreen } from './src/screens/PrincipalScreen';
import { UpdateDialog } from './src/components/UpdateDialog';
import { checkForUpdate, UpdateInfo } from './src/services/updateChecker';
import packageJson from './package.json';

const SPLASH_DURATION_MS = 1500;

export default function App() {
  const loaded = useTempoStore(s => s.loaded);
  const esInstalacionNueva = useTempoStore(s => s.esInstalacionNueva);
  const load = useTempoStore(s => s.load);
  const [booting, setBooting] = useState(true);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    load();
    checkForUpdate(packageJson.version).then(setUpdate).catch(() => {});
    const timer = setTimeout(() => setBooting(false), SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {booting || !loaded ? (
        <SplashScreen />
      ) : esInstalacionNueva ? (
        <ImportarScreen />
      ) : (
        <PrincipalScreen />
      )}
      {update && !updateDismissed ? (
        <UpdateDialog update={update} onDismiss={() => setUpdateDismissed(true)} />
      ) : null}
    </SafeAreaProvider>
  );
}
