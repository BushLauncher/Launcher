import { GameVersion, SubLaunchTaskCallback, RunningVersion } from '../../../public/GameDataPublic';
import Icon from './Icons/Icon';
import { getGameTypeIcon, getInstalledIcon } from '../views/SettingsViews/VersionSettingsView';
import styles from './css/publicStyle.module.css';
import { ComponentsPublic } from '../ComponentsPublic';
import { Button, Collapse, CollapseProps, Popover } from 'antd';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import hammerIcon from '../../../assets/graphics/icons/hammer.svg';
import { toast } from 'react-toastify';
import { MinecraftIssues } from '@xmcl/core';
import InstallReportCallbackMessage from './InstallReportCallbackMessage';
import { useState } from 'react';
import loadIcon from '../../../assets/graphics/icons/loading.svg';
import LaunchButton from '../main/LaunchButton';
import { NotificationParam } from '../../App';
import Loader from './Loader';
import "./css/publicStyle-ant-override.css"

type activeAndCallback = { active: boolean, callback?: () => any }

interface VersionCardProps extends ComponentsPublic {
  version: GameVersion,
  toolBox: {
    uninstall?: activeAndCallback,
    diagnose?: activeAndCallback,
    /**
     * @deprecated
     */
    install?: activeAndCallback,
    launch?: activeAndCallback,
    select?: activeAndCallback
  },
  settings?: {
    iconType: 'GameType' | 'Installed'
  }
}

export default function VersionCard({ version, toolBox, settings, className, style }: VersionCardProps) {
  const [isLoading, setLoading] = useState(false);
  const [isRunning, setRunning] = useState(false);

  async function requestUninstall() {
    const operation = window.electron.ipcRenderer.invoke('VersionManager:Uninstall', {
      version: version,
      path: undefined
    });
    const id = 'uninstallOperation' + version.id + version.gameType;
    // @ts-ignore
    window.electron.ipcRenderer.on('VersionManager:Uninstall', (callback: SubLaunchTaskCallback) => {
      if (callback.displayText) toast.update(id, { render: `Uninstalling ${version.id}: ${callback.displayText}` });
    });
    await toast.promise(operation, {
      pending: {
        render() {
          if (!isLoading) setLoading(true);
          return `Uninstalling ${version.id}...`;
        }
      },
      success: {
        render() {
          setLoading(false);
          if (toolBox.uninstall && toolBox.uninstall.callback) toolBox.uninstall.callback();
          return `Uninstalled ${version.id}`;
        }
      },
      error: {
        render({ data }) {
          setLoading(false);
          return 'Cannot uninstall ' + version.id + ':\n' + data;
        }
      }
    }, { toastId: id, closeButton: false });
  }

  async function requestDiagnose() {
    const id = toast.loading(`Diagnosing ${version.id}...`, { toastId: 'diagnoseOperation' + version.id + version.gameType });
    setLoading(true);
    await window.electron.ipcRenderer.invoke('VersionManager:Diagnose', {
      version: version,
      path: undefined
    }).then(res => {
      const hasProblems = (typeof res === 'object');
      setLoading(false);
      if (toolBox.diagnose && toolBox.diagnose.callback) toolBox.diagnose.callback();
      toast.update(id, {
        className: styles.toast,
        type: hasProblems ? 'warning' : 'success',
        isLoading: false,
        closeButton: hasProblems,
        autoClose: hasProblems ? false : undefined,
        hideProgressBar: hasProblems,
        render: !hasProblems ? <p className={styles.text}>{`No problems detected in version ${version.id}`}</p>
          : <div>
            <style>{'.Toastify__toast-icon {align-self: flex-start}'}</style>
            <p className={styles.text}>{`Some problems have been detected on version ${version.id}`}</p>
            <div className={styles.issuesContainer}>
              {(typeof res === 'object' && res !== null) && res.issues !== null &&
                res.issues.map((issus: MinecraftIssues, i: number) =>
                  <InstallReportCallbackMessage issus={issus} key={i} />)}</div>
          </div>

      });
    }).catch(err => {
      console.error(err);
      setLoading(false);
      toast.update(id, {
        isLoading: false,
        render({ data }) {
          return 'Cannot diagnose ' + version.id + ':\n' + data;
        }
      });
    });

  }

  async function requestLaunch() {
    toast.info('Launching ' + version.id);
    setRunning(true);
  }


  return (
    <div className={[styles.VersionCard, className].join(' ')} style={style}
         onClick={toolBox.select && toolBox.select.active && toolBox.select.callback ? toolBox.select.callback : undefined}>
      {isLoading ? <Icon icon={loadIcon} className={styles.loadIcon} />
        : toolBox.launch && version.installed &&
        <LaunchButton versionSelector={false} type={'square'} style={{ width: '3vw', height: '3vw', minWidth: 0 }}
                      onRun={requestLaunch} onExited={() => setRunning(false)} />}
      <Icon
        icon={settings && settings.iconType === 'Installed' ? getInstalledIcon(version.installed) : getGameTypeIcon(version.gameType)}
        className={[styles.icon, (settings && settings.iconType === 'Installed' ? styles.iconMin : undefined)].join(' ')} />
      <p>{version.id}</p>

      {<Loader className={styles.buttonContainer} content={async () => {
        const runningList: RunningVersion[] = await window.electron.ipcRenderer.invoke('GameEngine:getRunningList', {});
        const _isRunning = runningList.find(rv => rv.Version.id === version.id) !== undefined;
        if (isRunning !== _isRunning) setRunning(_isRunning);
        return <>{/*toolBox.install && !version.installed &&
          <Popover content={'Install'}>
            <Button key={'install'} type={'primary'} size={'large'} disabled={isLoading}
                    style={{ backgroundColor: 'var(--valid)' }}
                    icon={<DownloadOutlined style={{ fontSize: '2.5vw' }} />}
                    className={styles.button} onClick={requestInstall} />
          </Popover>*/}
          {toolBox.diagnose && version.installed &&
            <Popover content={!isRunning ? 'Diagnose' : 'Version is running...'}>
              <Button key={'diagnose'} size={'large'} icon={<Icon icon={hammerIcon} className={styles.icon} />}
                      className={styles.button} disabled={isLoading || isRunning}
                      style={{ borderColor: !isRunning ? '#ffb103' : '' }} onClick={() => requestDiagnose()} />
            </Popover>}
          {toolBox.uninstall && version.installed &&
            <Popover content={!isRunning ? 'Uninstall' : 'Version is running...'}>
              <Button key={'uninstall'} size={'large'} danger icon={<DeleteOutlined />}
                      disabled={isLoading || isRunning}
                      className={styles.button} onClick={() => requestUninstall()} />
            </Popover>}</>;
      }} />}
    </div>);
}

interface CollapsableVersionCardProps extends ComponentsPublic {
  parentVersion: VersionCardProps | JSX.Element,
  children: VersionCardProps[] | JSX.Element[]
}

export function CollapsableVersionCard(props: CollapsableVersionCardProps) {
  const list: CollapseProps['items'] = [
    {
      children: (props.children.map((version: VersionCardProps | JSX.Element, index) => {
        if ('toolBox' in version) {
          version = version as VersionCardProps;
          return <VersionCard {...version} key={index} />;
        } else {
          version = version as JSX.Element;
          return <span key={index}>{version}</span>;
        }
      })),
      label: 'toolBox' in props.parentVersion ? <VersionCard {...props.parentVersion} /> : props.parentVersion
    }
  ];
  return (
    <div className={[props.className, "CollapsableVersion"].join(" ")} style={props.style}>
      <Collapse items={list} size={"small"} bordered={false} />
    </div>
  );
}

