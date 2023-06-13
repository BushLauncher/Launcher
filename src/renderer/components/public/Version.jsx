import styles from './css/publicStyle.module.css';
import Icon from './Icons/Icon';
import doneIcon from '../../../assets/graphics/icons/done.svg';
import toDownloadIcon from '../../../assets/graphics/icons/download.svg';
import errorIcon from '../../../assets/graphics/icons/close.svg';

export default function Version({ version, tools, className, isInstalled, selected, canSelect }) {  //verify var

  //TODO: Implement the tools
  //props: "tools": bool, if the tools will renderer

  const getIcon = () => {
    if (isInstalled === undefined) return errorIcon;
    return isInstalled ? doneIcon : toDownloadIcon;
  };
  const SelectVersion = async (version) => {
    if (canSelect) await window.electron.ipcRenderer.sendMessage('Version:set', (version));
  };

  return (
    <div
      onClick={canSelect ? () => SelectVersion(version) : null}
      className={[
        styles.Version,
        className,
        isInstalled ? styles.versionInstalled : styles.versionToDownload,
        selected ? styles.versionSelected : ''
      ].join(' ')}
    >
      <Icon icon={getIcon()} className={styles.versionIcon} alt={'icon'} />
      <p className={styles.versionText}>{version.id}</p>
    </div>
  );
}
