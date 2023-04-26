import TabViewer from './Viewer';
import styles from './TabViewStyle.module.css';
import { useState } from 'react';
import TabNavBar from './NavBar';

export function build({
  id,
  displayName,
  iconPath,
  content,
  action,
  selected,
  customStyle,
}) {
  //verify vars
  if (typeof id != 'string') console.error("'id' must be a 'String'");
  if (typeof displayName != 'string' && typeof displayName != 'undefined')
    console.error("'DisplayName' must be a 'String'");
  displayName = displayName
    ? displayName
    : id.charAt(0).toUpperCase() + id.slice(1);
  if (typeof action != 'function' && typeof action != 'undefined')
    console.error("'action' must be a function");
  if (typeof selected != 'boolean' && typeof selected != 'undefined')
    console.error("'selected' must be an boolean");

  return {
    id: id,
    displayName: displayName,
    iconPath: iconPath,
    content: content,
    action: action,
    selected: selected,
    customStyle: customStyle,
  };
}

export default function TabView({
  style,
  contentList,
  selectedTabIndex,
  params,
}) {
  if (contentList == null)
    console.warn('the TabView is empty ! (content == null)');
  if (typeof contentList[selectedTabIndex] === 'undefined')
    console.error(selectedTabIndex + "'s Tab don't exist");

  const [whichIsSelected, select] = useState(contentList[selectedTabIndex]);
  function saveSelectedView(viewName) {
    window.electron.ipcRenderer.sendMessage('updateData', {
      dataPath: 'interface.selectedTab',
      value: viewName,
    });
  }

  function changeView(tabIndex, action) {
    if (typeof contentList[selectedTabIndex] != 'undefined') {
      /*console.log('switching to: ' + data.id)*/
      select(contentList[tabIndex]);
      saveSelectedView(contentList[tabIndex].id);
      //execute afterAction
      if (action) action();
    } else {
      console.error(tabIndex + "'s tab don't exist");
    }
  }

  return (
    <div className={styles.TabView} datapos={style.pos}>
      <TabNavBar
        whichIsSelected={whichIsSelected}
        select={changeView}
        tabList={contentList}
        collapsable={params.collapsable}
        collapsed={params.collapsed}
      />
      <TabViewer View={whichIsSelected.content} />
    </div>
  );
}
