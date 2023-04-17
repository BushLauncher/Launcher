import NotificationModule from './NotificationModule';

export default class NotificationModuleProvider {
  constructor() {}
  render(props: {}) {
    return new NotificationModule(props);
  }
}
