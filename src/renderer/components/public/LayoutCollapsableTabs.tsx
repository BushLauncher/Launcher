import React, { useState } from 'react';
import { Button, Menu, MenuProps } from 'antd';
import Icon from './Icons/Icon';
import arrowIcon from '../../../assets/graphics/icons/caret-left.svg';
import Sider from 'antd/es/layout/Sider';
import { ComponentsPublic } from '../ComponentsPublic';
import './css/ant-override.css';
import { StyleProvider } from '@ant-design/cssinjs';


interface CollapsableMenuProps extends ComponentsPublic {
  content: MenuProps['items'] & {extra: boolean};
  selectedName?: string;
  settings?: MenuProps;
  onChange?: (e: any) => any;
}

export default function LayoutCollapsableTabs(props: CollapsableMenuProps) {
  if (props.content === undefined || props.content === null || props.content.length === 0) {
    console.warn('Content is empty');
    return <></>;
  }
  const [collapsed, setCollapsed] = useState(true);
  // @ts-ignore
  const [selected, Select] = useState<string>(props.selectedName !== undefined ? props.selectedName : props.content[0].key);
  return (
    <StyleProvider hashPriority={"high"}>
      <Sider collapsed={collapsed} style={props.style}>
        <Menu mode={'vertical'} selectedKeys={[selected]} className={props.className}
              items={props.content} {...(props.settings)} onClick={(e) => {
          Select(e.key);
          if (props.onChange) props.onChange(e);
        }} />
        <Button onClick={() => setCollapsed(!collapsed)} icon={<Icon icon={arrowIcon} className={"icon"} />} className={"collapse"}/>
      </Sider>
    </StyleProvider>);
}
