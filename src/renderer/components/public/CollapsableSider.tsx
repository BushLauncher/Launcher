import React, { useEffect, useState } from 'react';
import { Button, SiderProps } from 'antd';
import Icon from './Icons/Icon';
import arrowIcon from '../../../assets/graphics/icons/caret-left.svg';
import { DefaultProps } from '../../../types/DefaultProps';
import '../../css/Tabs-ant-override.css';
import { StyleProvider } from '@ant-design/cssinjs';
import Sider from 'antd/es/layout/Sider';
import styles from "../../css/publicStyle.module.css"


interface CollapsableMenuProps extends DefaultProps, Omit<SiderProps, 'content'> {
  content: JSX.Element | ((collapsed: boolean)=> JSX.Element),
  defaultCollapsed?: boolean;
  onCollapse?: (isCollapsed: boolean) => any;
}

export default function CollapsableSider({
                                           defaultCollapsed,
                                           onCollapse,
                                           content,
                                           ...props
                                         }: CollapsableMenuProps) {
  defaultCollapsed = defaultCollapsed || false;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    if (onCollapse) onCollapse(collapsed);
  }, [collapsed]);

  return (
    <StyleProvider hashPriority={'high'}>
      <div className={styles.CollapsableMenu}>
        <Sider collapsed={collapsed} {...props}>
          {typeof content === "function" ? content(collapsed) : content}
        </Sider>
        <Button onClick={() => setCollapsed(!collapsed)} icon={<Icon icon={arrowIcon} className={'icon'}
                                                                     style={{ transform: (collapsed ? 'rotateZ(180deg) scale(0.8)' : 'scale(0.8)') }} />}
                className={styles.CollapseButton} style={{ left: (collapsed ? '6vw' : '17vw') }} />
      </div>
    </StyleProvider>);
}
