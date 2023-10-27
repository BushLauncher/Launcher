import React from 'react';
import styles from '../../css/publicStyle.module.css';
import { DefaultProps } from '../../../types/DefaultProps';

interface MCSkinProps extends DefaultProps {
  userMCName: string;
}

export default function MinecraftSkin({ userMCName, className, style }: MCSkinProps) {
  return (
    <img
      className={[styles.MinecraftSkin, className].join(' ')}
      alt={userMCName + '\'s Skin'}
      style={style}
      src={'https://mc-heads.net/avatar/' + userMCName}
    />
  );

}
