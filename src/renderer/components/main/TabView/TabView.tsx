import TabViewer from './Viewer';
import styles from './TabViewStyle.module.css';
import { useState } from 'react';
import TabNavBar from './NavBar';
import { ComponentsPublic } from '../../ComponentsPublic';
import EmptyView from '../../views/emptyView';

export interface TabParams extends ComponentsPublic {
  id: string,
  displayName?: string,
  iconPath?: string,
  content?: Element,
  onClickAction?: () => {},
  selected?: boolean
}

export interface TabViewParameters {
  collapsable?: boolean;
  collapsed?: boolean;
  style?: TabViewStyle;
}

export interface TabViewStyle {
  orientation?: 'Vertical' | 'Horizontal';
  tabAlign?: 'Top' | 'Center' | 'Bottom';
  navBarBackgroundVisibility?: boolean,
  tabSelectionEffect?: "Background" | "Underline"
}

export interface TabViewProps extends ComponentsPublic {
  contentList: TabParams[],
  selectedTabIndex?: number,
  params?: TabViewParameters
}

export default function TabView(props: TabViewProps) {
  if (props.contentList.length == 0)
    console.warn('the TabView is empty ! (content == null)');
  const selectedTab: number = props.selectedTabIndex && props.selectedTabIndex != -1 ? props.selectedTabIndex : 0;
  const [whichIsSelected, select] = useState(props.contentList[selectedTab]);

  function saveSelectedView(viewName: string) {
    window.electron.ipcRenderer.sendMessage('updateData', {
      dataPath: 'interface.selectedTab',
      value: viewName
    });
  }

  function changeView(tabIndex: number, action: () => {}) {
    if (props.contentList[tabIndex]) {
      select(props.contentList[tabIndex]);
      saveSelectedView(props.contentList[tabIndex].id);
      //execute afterAction
      if (action) action();
    } else console.error(tabIndex + '\'s tab don\'t exist');

  }

  function getCollapsable() {
    if (props.params?.style?.orientation === 'Horizontal') {
      return props.params.collapsable != undefined ? props.params.collapsable : true;
    }/*else cannot collapse horizontal nav bar on a **Vertical** view*/
  }
  return (
    <div className={[styles.TabView, props.className].join(' ')}
         data-orientation={props.params?.style?.orientation ? props.params?.style.orientation : 'Horizontal'}>
      <TabNavBar
        whichIsSelected={whichIsSelected}
        select={changeView}
        tabList={props.contentList}
        collapsable={getCollapsable()}
        styleSettings={props.params?.style}
        collapsed={props?.params?.collapsed ? props?.params?.collapsed : false}
      />
      <TabViewer View={whichIsSelected.content ? whichIsSelected.content : EmptyView} />
    </div>
  );
}
