import styles from './css/publicStyle.module.css';
import React, { MouseEventHandler, ReactElement } from 'react';
import { ComponentsPublic } from '../ComponentsPublic';
export enum ButtonType {
  Rectangle,
  Square,
}
export interface props extends ComponentsPublic {
  action: MouseEventHandler;
  content: string | ReactElement;
  type: ButtonType;
}

export default class Button extends React.Component<props, {}> {
  constructor(props: props) {
    super(props);
  }
  render() {
    return (
      <div
        onClick={this.props.action}
        className={[
          styles.Button,
          this.props.type ? styles[this.props.type] : '',
          this.props.className,
        ].join(' ')}
      >
        {this.props.content}
      </div>
    );
  }
}
