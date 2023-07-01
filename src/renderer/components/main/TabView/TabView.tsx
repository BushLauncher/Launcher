import TabViewer from './Viewer';
import styles from './TabViewStyle.module.css';
import { useState } from 'react';
import TabNavBar from './NavBar';
import { ComponentsPublic } from '../../ComponentsPublic';
import EmptyView from '../../views/emptyView';

//TODO: add loading icon
export interface TabParams extends ComponentsPublic {
  id: string,
  displayName?: string,
  iconPath?: string,
  content?: JSX.Element | (() => JSX.Element),
  onClickAction?: () => any,
  selected?: boolean
}

export interface TabViewParameters {
  collapsable?: boolean;
  collapsed?: boolean;
  onCollapseMenu?: (collapsedState: boolean) => void;
  styleSettings?: TabViewStyle;
}

export interface TabViewStyle {
  orientation?: 'Vertical' | 'Horizontal';
  tabAlign?: 'Top' | 'Center' | 'Bottom';
  navBarBackgroundVisibility?: boolean,
  tabSelectionEffect?: 'Background' | 'Underline'
}

export interface TabViewProps extends ComponentsPublic {
  contentList: TabParams[],
  selectedTabIndex?: number,
  params?: TabViewParameters
}

export default function TabView({ className, contentList, params, selectedTabIndex }: TabViewProps) {
  if (contentList.length == 0) console.warn('the TabView is empty ! (content == null)');
  const selectedTab: number = (selectedTabIndex && selectedTabIndex > 0 && selectedTabIndex <= contentList.length) ? selectedTabIndex : 0;
  const [whichIsSelected, select] = useState(contentList[selectedTab]);

  function saveSelectedView(viewName: string) {
    window.electron.ipcRenderer.sendMessage('updateData', {
      dataPath: 'interface.selectedTab',
      value: viewName
    });
  }

  function changeView(tabIndex: number, action?: () => {}) {
    const tabData = contentList[tabIndex];
    if (tabData) {
      select(tabData);
      saveSelectedView(tabData.id);
      //execute afterAction
      if (action) action();
    } else console.error(tabIndex + '\'s tab don\'t exist');

  }

  function getCollapsable() {
    if (params?.styleSettings?.orientation === 'Horizontal') {
      return params.collapsable != undefined ? params.collapsable : true;
    }else return false/* cannot collapse horizontal nav bar on a **Vertical** view*/
  }

  return (
    <div className={[styles.TabView, className].join(' ')}
         data-orientation={params?.styleSettings?.orientation ? params?.styleSettings.orientation : 'Horizontal'}>
      <TabNavBar
        whichIsSelected={whichIsSelected}
        select={changeView}
        tabList={contentList}
        collapsable={getCollapsable()}
        collapsed={params?.collapsed ? params?.collapsed : false}
        onCollapseMenu={params?.onCollapseMenu}
        styleSettings={params?.styleSettings}
      />
      <TabViewer View={whichIsSelected.content ? whichIsSelected.content : EmptyView}
                 navBarVisibility={params?.styleSettings?.navBarBackgroundVisibility} />
    </div>
  );
}
