import styles from './TabViewStyle.module.css';
import ButtonStyle from '../../public/css/inputStyle.module.css';
import Tab from './Tab';
import Button, { ButtonType } from '../../public/Input/Button';
import { useState } from 'react';
import arrowIcon from '../../../../assets/graphics/icons/caret-left.svg';
import { TabParams, TabViewParameters } from './TabView';
import { ComponentsPublic } from '../../ComponentsPublic';

interface TabNavBarProps extends ComponentsPublic, TabViewParameters {
  whichIsSelected: TabParams;
  select: (tabIndex: number, action?: () => {}) => void;
  tabList: TabParams[];
}

export default function TabNavBar(props: TabNavBarProps) {
  const [isCollapsed, setCollapsed] = useState(props.collapsed ? props.collapsed : false);
  return (
    <div
      className={[styles.NavBar].join(' ')}
      data-collapsed={props.collapsable ? isCollapsed.toString() : null}
      data-align={props.styleSettings?.tabAlign !== undefined ? props.styleSettings.tabAlign : 'Top'}
      data-visible={props.styleSettings?.navBarBackgroundVisibility}
      data-onselected={props.styleSettings?.tabSelectionEffect}
    >
      {props.tabList.map((tab, index) => (
        <Tab
          key={index}
          data={tab}
          isSelected={index === props.tabList.indexOf(props.whichIsSelected)}
          onSelect={(action?: () => any) => props.select(index, action)}
        />
      ))}
      {props.collapsable && (
        <Button
          action={() => {
            setCollapsed((prevState) => {
              if (props.onCollapseMenu) props.onCollapseMenu(!prevState);
              return !prevState;
            });
          }}
          content={
            <img
              className={[ButtonStyle.img, styles.img].join(' ')}
              src={arrowIcon}
              alt={'collapse Menu'}
            />
          }
          type={ButtonType.Square}
          className={styles.CollapseButton}
        />
      )}
    </div>
  );
}
