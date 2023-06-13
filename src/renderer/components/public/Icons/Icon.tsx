import { ComponentsPublic } from '../../ComponentsPublic';
import React from 'react';

export interface IconProps extends ComponentsPublic {
  icon: string | null | undefined;
  alt?: string;
}
export default class Icon extends React.Component<IconProps, {}> {
  constructor(props: IconProps) {
    super(props);
  }
  render() {
    if (this.props.icon !== null)
      return (
        <img
          src={this.props.icon}
          alt={this.props.alt}
          style={this.props.style}
          className={this.props.className}
        />
      );
  }
}
