import { ComponentsPublic } from '../../ComponentsPublic';
import React from 'react';
import styles from '../css/publicStyle.module.css';

export interface IconProps extends ComponentsPublic {
  icon: string | undefined;
  alt?: string;
}

export default function Icon({ icon, alt, style, className }: IconProps) {
  return icon !== undefined ? (
    <img
      src={icon}
      alt={alt}
      style={style}
      className={[styles.IconDefault, className].join(' ')}
    />
  ) : <></>;
}
