import React from 'react';
import { ComponentsPublic } from '../ComponentsPublic';
import emptyViewStyles from '../views/css/emptyViewStyle.module.css';
import Tab from '../main/TabView/Tab';

export interface ViewProps extends PublicViewAdditionalProps {
  content?: JSX.Element | ((reload?: () => void, tab?: Tab) => JSX.Element),
  //TODO: Add async content
  _tab?: Tab
}

export interface PublicViewAdditionalProps extends ComponentsPublic {
  onClickAction?: () => any,
  selected?: boolean,
  onLoading?: (isLoading: boolean)=> any

}

export default class View extends React.Component<ViewProps | keyof ViewProps['content'], {
  loadedContent: JSX.Element | null
}> {

  constructor(props: ViewProps) {
    const resolvedProps = (typeof props === 'object') ? props : { content: props };
    super(resolvedProps);
    this.state = {
      loadedContent: null
    };
  }

  reload() {
    this.forceUpdate();
  }

  getView() {
    const content = this.props.content;
    if (content === undefined) return EmptyViewContent();
    else return (typeof content === 'function') ? content(this.reload, this.props._tab) : content;
  }

  render() {
    return <>{this.getView()}</>;
  }

}


function EmptyViewContent(): JSX.Element {
  return (
    <div className={emptyViewStyles.Content}>
      <p className={emptyViewStyles.message}>Nothing to show.</p>
    </div>
  );
}
