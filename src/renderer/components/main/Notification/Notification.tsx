import React, { ReactElement } from 'react';
export type notificationContent = string | ReactElement;
export enum notificationType {
  Sucess,
  Info,
  Warn,
  Error
}
export interface notification {
  content: notificationContent;
  closable?: boolean;
  type: notificationType;
}

export default class Notification extends React.Component<notification, {}> {
  constructor(props: notification) {
    super(props);
    this.state = {
      content: props.content
    }
  }
  close(): void {}
  update(newContent: notificationContent): void {}
  render() {
    return <div>{this.props.content}</div>;
  }
}
