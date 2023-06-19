import { ComponentsPublic } from '../../ComponentsPublic';
import React from 'react';
import styles from '../css/publicStyle.module.css';

export interface IconProps extends ComponentsPublic {
  icon: string | null | undefined;
  alt?: string;
}

export default function Icon(props: IconProps) {
  if (props.icon !== null)
    return (
      <img
        src={props.icon}
        alt={props.alt}
        style={props.style}
        className={[styles.IconDefault, props.className].join(' ')}
      />
    );
  else return <></>;
}
