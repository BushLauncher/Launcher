import styles from './css/LaunchButton.module.css';
import Icon from '../public/Icons/Icon';
import launchIcon from '../../../assets/graphics/icons/caret-right.svg';
import downArrowIcon from '../../../assets/graphics/icons/arrow_down.svg';
import Line from '../public/Line';
import { useContext, useState } from 'react';
import Version from '../public/Version';
import { concatXmclVersion, GameType } from '../../../internal/public/GameData';
import Loader from '../public/Loader';
import { globalStateContext } from '../../index';
function getSelected() {
  return window.electron.ipcRenderer.invoke('Version:get');
}
export default function LaunchButton({ customStyle, versionSelector }) {
  const [isVersionSelectorOpened, setVersionSelectorOpened] = useState(false);
  const {isOnline} = useContext(globalStateContext)

  const versionSelectorInit = (reload) => {
    if (versionSelector) {
      return new Promise((resolve, reject) => {
        getSelected().then((selectedVersion) => {
          resolve(
            <div
              className={styles.versionSelector}
              onClick={() => setVersionSelectorOpened(!isVersionSelectorOpened)}
            >
              <div className={styles.dataContainer}>
                <Icon
                  className={styles.dropdownIcon}
                  icon={downArrowIcon}
                  alt={'open the dropdown'}
                />
                <p className={styles.versionText}>
                  {selectedVersion.id.toString()}
                </p>
              </div>
              <div className={styles.versionListDropdown}>
                {
                  <Loader
                    content={(reload) => {
                      return new Promise((resolve, reject) => {
                        window.electron.ipcRenderer
                          .invoke('Version:getList', { gameType: GameType.VANILLA })
                          .then((list) => {
                            resolve(
                              list.map((version, index) => {
                                return (
                                  <Version
                                    version={concatXmclVersion(version, {
                                      id: version.id,
                                      gameType: GameType.VANILLA,
                                    })}
                                    key={index}
                                    className={[
                                      styles.version,
                                      version.id === selectedVersion.id
                                        ? styles.versionSelected
                                        : '',
                                    ].join(' ')}
                                    isInstalled={version.installed}
                                    selected={version.id === selectedVersion.id}
                                  />
                                );
                              })
                            );
                          });
                        window.electron.ipcRenderer.sendMessage(
                          'getVersionList'
                        );
                      });
                    }}
                    className={styles.loaderContentVersion}
                  />
                }
              </div>
            </div>
          );
        });
      });
    } else return null;
  };
  return (
    <div
      className={[styles.LaunchButton, !isOnline && styles.offlineStyle].join(
        ' '
      )}
      style={customStyle}
      data-version-selector={versionSelector.toString()}
      data-version-selector-opened={isVersionSelectorOpened}
    >
      {/*to preserve HTML structure for css selector,
      the content is reorganized in css*/}
      <div className={styles.Content}>
        <Icon
          className={styles.icon}
          icon={launchIcon}
          alt={'Launch the game Button'}
        />
        <p className={styles.text}>Launch</p>
      </div>
      <Loader
        content={versionSelectorInit}
        className={styles.versionSelectorLoader}
      />

      {versionSelector ? (
        <Line className={styles.line} direction={'vertical'} />
      ) : null}
    </div>
  );
}
