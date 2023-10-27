import styles from '../../../css/inputStyle.module.css';
import React, { MouseEventHandler, ReactElement } from 'react';
import { DefaultProps } from '../../../../types/DefaultProps';
export enum ButtonType {
  Rectangle= "rectangle",
  Square= "square",
  StyleLess = "styleLess"
}
export interface ButtonProps extends DefaultProps {
  action: MouseEventHandler;
  content: string | ReactElement;
  type: ButtonType;
}
//TODO: review with ant buttons
export default class Button extends React.Component<ButtonProps, {}> {
  constructor(props: ButtonProps) {
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
