import { Layout, Tabs, TabsProps } from 'antd';
import React from 'react';
import { ComponentsPublic } from '../../ComponentsPublic';
import emptyViewStyles from '../../views/css/emptyViewStyle.module.css';
import styles from './TabViewStyle.module.css';
import { StyleProvider } from '@ant-design/cssinjs';
import "./ant-override.css"


export type ViewParams = TabsProps['items'];

interface ViewSwitcherProps extends ComponentsPublic, TabsProps {
}

export default function ViewSwitcher(props: ViewSwitcherProps) {


  return (
    <StyleProvider hashPriority={'high'}>
      <Layout className={[styles.TabView, props.className].join(' ')} style={props.style}>
        <Tabs {...props as unknown as TabsProps} className={"NavBar"} />
      </Layout>
    </StyleProvider>);
}


const EmptyContent = (<div className={emptyViewStyles.Content}>
  <p className={emptyViewStyles.message}>Nothing to show.</p>
</div>);
