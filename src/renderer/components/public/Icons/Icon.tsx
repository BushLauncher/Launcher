import { ComponentsPublic } from '../../ComponentsPublic';
import React from 'react';
import styles from '../css/publicStyle.module.css';

export interface IconProps extends ComponentsPublic, React.HTMLAttributes<HTMLElement>{
  icon: string | undefined;
  alt?: string;
}

export default function Icon(props: IconProps) {
  return props.icon !== undefined ? (
    <img
      {...props}
      src={props.icon}
      alt={props.alt}
      style={props.style}
      className={[styles.IconDefault, props.className].join(' ')}
    />
  ) : <></>;
}
