import { MinecraftIssues } from '@xmcl/core';
import styles from './css/publicStyle.module.css';

import missingIcon from '../../../assets/graphics/icons/file-missing.svg';
import corruptedIcon from '../../../assets/graphics/icons/file-corrupted.svg';
import Icon from './Icons/Icon';
import { Collapse } from 'antd';


export default function InstallReportCallbackMessage({ issus }: { issus: MinecraftIssues }) {
  function getIcon() {
    switch (issus.type) {
      case 'missing':
        return missingIcon;
      case 'corrupted':
        return corruptedIcon;
      default:
        return;
    }
  }

  console.log(issus);
  return (
    <Collapse items={[
      {
        key: 'file',
        label: (<p className={styles.text}>{issus.hint}</p>),
        children: (<p className={styles.text}>{issus.file}</p>),
        extra: (<Icon icon={getIcon()} className={styles.icon} />)
      }
    ]} className={styles.InstallReportCallbackMessage} />);

}
