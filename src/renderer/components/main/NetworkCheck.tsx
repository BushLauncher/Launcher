import { toast } from 'react-toastify';
import { useContext } from 'react';
import { globalContext } from '../../index';


export default function NetworkCheck() {
  const { offlineMode } = useContext(globalContext);
  let connexionToastId = 'networkConnexion';

  function launchNetworkCheck() {
    /**
     * Return a promise
     * @return Resolve if online
     * @throws Reject if offline
     */
    const getNetworkState = () => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (offlineMode) {
            if (navigator.onLine) resolve();
          } else if (!navigator.onLine) reject();
        }, 2000);
      });
    };
    const updateNetworkState = () => {
      if (navigator.onLine !== (!offlineMode)) {
        //if the current state != global state
        // noinspection JSIgnoredPromiseFromCall
        toast.promise(getNetworkState, {
          pending: `Connecting to the internet...`/*[currently: ${navigator.onLine}, context: ${isOnline}]`*/,
          success: {
            render() {
              setTimeout(() => {
                window.electron.ipcRenderer.sendMessage("Reload", {});
              }, 2000);
              return 'Connected !';
            }
          },
          error: {
            render() {
              setTimeout(() => {
                window.electron.ipcRenderer.sendMessage("Reload", {});
              }, 2000);
              return 'We lost connexion !';
            }
          }
        }, {
          toastId: 'networkConnexion', autoClose: 20000, hideProgressBar: true
        });
      } else if (toast.isActive(connexionToastId)) toast.dismiss(connexionToastId);
    };

    updateNetworkState();
    setInterval(updateNetworkState, 5000);
  }

  launchNetworkCheck();

  return <></>;
}
