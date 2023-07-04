import { Content } from 'antd/es/layout/layout';
import { Layout, MenuProps } from 'antd';
import React, { useEffect, useState } from 'react';
import LayoutCollapsableMenu from '../../public/LayoutCollapsableMenu';
import { ComponentsPublic } from '../../ComponentsPublic';
import emptyViewStyles from '../../views/css/emptyViewStyle.module.css';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import styles from './TabViewStyle.module.css';


type ViewContent = JSX.Element

export type ViewParams = ItemType & { content: ViewContent };

interface ViewSwitcherProps extends ComponentsPublic {
  content: ViewParams[];
  selectedTabName?: string;
  persistent?: boolean;
}

type KeyedContent = { key: string, content: JSX.Element | undefined }
export default function ViewSwitcher(props: ViewSwitcherProps) {
  const persistent = props.persistent === undefined ? false : props.persistent;

  const [ContentList, setContentList] = useState<KeyedContent[]>([]);
  //@ts-ignore
  const [selected, Select] = useState<string>(props.selectedTabName !== undefined ? props.selectedTabName : props.content[0].key);

  function switchView(name: string) {
    const displayContentId = props.content.findIndex(t => t.key === name);
    if (displayContentId === -1) throw new Error('Tab is null');


    const isStored: boolean = (ContentList.findIndex(c => c.key === name) >= 0);

    if (!isStored) {
      setContentList(ContentList.concat({
        key: name,
        content: props.content[displayContentId].content
      }));
    }
    Select(name);
  }


  useEffect(() => {
    if (props.selectedTabName !== undefined) switchView(props.selectedTabName);
  }, []);

  function getContent() {
    console.log(ContentList);
    const contentId = ContentList.findIndex((c) => c.key === selected);
    if (persistent) {
      return ContentList.map((content, i) => {
        return <div key={i}
                    style={{ display: contentId === i ? undefined : 'none' }}>{content.content !== undefined ? content.content : EmptyContent}</div>;
      });
    } else return <div>{ContentList.length === 0 ? EmptyContent : ContentList[contentId].content}</div>;
  }

  return (
    <Layout className={props.className} style={props.style}>
      <LayoutCollapsableMenu content={props.content as unknown as MenuProps['items']}
                             selectedName={props.selectedTabName}
                             onChange={(e) => switchView(e.key)}/>

      <Content>{getContent()}</Content>
    </Layout>);
}


const EmptyContent = (<div className={emptyViewStyles.Content}>
  <p className={emptyViewStyles.message}>Nothing to show.</p>
</div>);
