import styles from './TabViewStyle.module.css';
import ButtonStyle from '../../public/css/inputStyle.module.css';
import Tab, { TabParam } from './Tab';
import Button, { ButtonType } from '../../public/Input/Button';
import React, { useEffect, useRef, useState } from 'react';
import arrowIcon from '../../../../assets/graphics/icons/caret-left.svg';
import { TabViewParameters } from './TabView';
import { ComponentsPublic } from '../../ComponentsPublic';

interface TabNavBarProps extends ComponentsPublic, TabViewParameters {
  onSelect: (id: string, view: JSX.Element) => void;
  tabList: TabParam[];
  defaultSelected: string | number;
}


export default function TabNavBar(props: TabNavBarProps) {
  const [isCollapsed, setCollapsed] = useState(props.collapsed ? props.collapsed : false);
  const tabRef = useRef<Tab[]>([]);


  function changeView(tabName: string, action?: () => {}) {
    const resolvedId = tabRef.current.findIndex(tab => tab.props.id === tabName);
    if (resolvedId === -1) {
      console.error(tabName + '\'s tab don\'t exist');
      return;
    } else {
      //Update navBar
      tabRef.current.forEach(tab => {
        if (tab.props.id !== tabName) tab.Deselect();
      });

      //update View
      props.onSelect(tabName, tabRef.current[resolvedId].generateView());


      //execute afterAction
      if (action) action();
    }
  }

  useEffect(() => {
    const name = typeof props.defaultSelected === 'number' ? props.tabList[props.defaultSelected].id : props.defaultSelected;
    const id: number = typeof props.defaultSelected === 'number' ? props.defaultSelected : props.tabList.findIndex((t) => t.id === props.defaultSelected);
    changeView(name, props.tabList[id].onSelect);
  }, []);

  return (
    <div
      className={[styles.NavBar].join(' ')}
      data-collapsed={props.collapsable ? isCollapsed.toString() : null}
      data-align={props.styleSettings?.tabAlign !== undefined ? props.styleSettings.tabAlign : 'Top'}
      data-visible={props.styleSettings?.navBarBackgroundVisibility}
      data-onselected={props.styleSettings?.tabSelectionEffect}
    >
      {props.tabList.map((tabParams, index) => {
          return <Tab {...tabParams} key={index} ref={(a) => {
            if (a !== null && !tabRef.current.includes(a)) tabRef.current.push(a);
          }}
                      _handleChangeView={(action) => changeView(tabParams.id, action)}
                      _isSelected={props.defaultSelected === tabParams.id || props.defaultSelected === index} />;
        }
      )}
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
