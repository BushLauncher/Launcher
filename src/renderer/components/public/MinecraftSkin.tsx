import React from 'react';
import styles from './css/publicStyle.module.css';
type MCSkinProps = {
  userMCName: string;
  className?: string;
};

export default class MinecraftSkin extends React.Component<MCSkinProps, {}> {
  constructor(props: MCSkinProps) {
    super(props);
  }
  render() {
    return (
      <img
        className={[styles.MinecraftSkin, this.props.className].join(' ')}
        alt={this.props.userMCName + "'s Skin"}
        src={"https://mc-heads.net/avatar/" + this.props.userMCName}
      />
    );
  }
}
