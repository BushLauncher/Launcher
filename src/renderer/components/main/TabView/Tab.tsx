import styles from './TabViewStyle.module.css';
import React from 'react';
import { ComponentsPublic } from '../../ComponentsPublic';
import View, { ViewProps } from '../../public/View';
import Icon from '../../public/Icons/Icon';
import loadingIcon from '../../../../assets/graphics/icons/loading.svg';

export interface TabParam extends ComponentsPublic {
  id: string,
  content?: ViewProps;
  displayName?: string,
  iconPath?: string,
  onDeselect?: () => any
  onSelect?: () => any;
}

interface ResolvedTabParam extends TabParam {
  _handleChangeView: (action?: () => any) => any;
  _isSelected: boolean;
}


export default class Tab extends React.Component<ResolvedTabParam, { isSelected: boolean, isLoading: boolean }> {

  constructor(props: ResolvedTabParam) {
    super(props);
    this.state = ({
      isSelected: props._isSelected,
      isLoading: false
    });
  }


  public generateView() {
    return <View {...this.props.content} _tab={this} />;
  }

  render() {
    return (
      <div
        className={[styles.Tab, this.state.isSelected ? styles.selected : ''].join(' ')}
        onClick={() => this.Select()}
        style={this.props.style}
      >
        {this.props.iconPath && <div
          className={styles.icon}
          style={{ backgroundImage: `url(${this.props.iconPath})` }}
        />}
        <p className={styles.label}>{this.getDisplayName()}</p>
        {this.state.isLoading && <Icon icon={loadingIcon} />}
      </div>);
  }

  public setLoading(isLoading: boolean) {
    this.setState({ isLoading: isLoading });
  }

  public Select() {
    this.setState({ isSelected: true });
    this.props._handleChangeView(this.props.onSelect);
  }

  public Deselect() {
    this.setState({ isSelected: false });
    if (this.props.onDeselect) this.props.onDeselect();
  }

  getDisplayName() {
    const id = this.props.id;
    return id.charAt(0).toUpperCase() + id.slice(1);
  }


}


