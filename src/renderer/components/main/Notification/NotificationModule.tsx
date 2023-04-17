import React from 'react';
import Notification, { notification } from './Notification';
type notificationList = [];
export default class NotificationModule extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      notificationList: [],
    };
  }
  createNotification(notificationData: notification) {
    this.setState({
      notificationList: [
        ...this.state.notificationList,
        new Notification(notificationData),
      ],
    });
  }
  render() {
    return <div></div>;
  }
}
