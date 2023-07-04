import styles from './TabViewStyle.module.css';
import TabNavBar from './NavBar';
import { ComponentsPublic } from '../../ComponentsPublic';
import { TabParam } from './Tab';
import React, { useState } from 'react';
import View from '../../public/View';

//TODO: add loading icon
//TODO: add view persistance

export interface TabViewStyle {
  orientation?: 'Vertical' | 'Horizontal';
  tabAlign?: 'Top' | 'Center' | 'Bottom';
  navBarBackgroundVisibility?: boolean,
  tabSelectionEffect?: 'Background' | 'Underline'
}

export interface TabViewParameters {
  collapsable?: boolean;
  collapsed?: boolean;
  onCollapseMenu?: (collapsedState: boolean) => void;
  styleSettings?: TabViewStyle;
}

export interface TabViewProps extends ComponentsPublic {
  tabList: TabParam[],
  defaultSelectedTabId?: number | string,
  params?: TabViewParameters
}

export default function TabView({ className, tabList, params, defaultSelectedTabId }: TabViewProps) {
  if (tabList.length == 0) console.warn('the TabView is empty ! (content == null)');
  const [currentView, setCurrentView] = useState(<View content={undefined} />);

  function applyChange(id: string, view: JSX.Element) {
      setCurrentView(view );
  }

  function getCollapsable() {
    if (params?.styleSettings?.orientation === 'Horizontal') {
      return params.collapsable != undefined ? params.collapsable : true;
    } else return false;/* cannot collapse horizontal nav bar on a **Vertical** view*/
  }

  return (
    <div className={[styles.TabView, className].join(' ')}
         data-orientation={params?.styleSettings?.orientation ? params?.styleSettings.orientation : 'Horizontal'}>
      <TabNavBar
        onSelect={applyChange}
        tabList={tabList}
        collapsable={getCollapsable()}
        collapsed={params?.collapsed ? params?.collapsed : false}
        onCollapseMenu={params?.onCollapseMenu}
        styleSettings={params?.styleSettings}
        defaultSelected={defaultSelectedTabId !== undefined ? defaultSelectedTabId : 0}
      />
      {currentView}
    </div>
  );
}
