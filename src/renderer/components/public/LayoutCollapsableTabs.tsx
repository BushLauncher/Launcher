import React, { useEffect, useState } from 'react';
import { Button, Popover, Tabs, TabsProps } from 'antd';
import Icon from './Icons/Icon';
import arrowIcon from '../../../assets/graphics/icons/caret-left.svg';
import { ComponentsPublic } from '../ComponentsPublic';
import '../../css/Tabs-ant-override.css';
import { StyleProvider } from '@ant-design/cssinjs';
import { Tab } from 'rc-tabs/lib/interface';

interface items extends Omit<Tab, 'label'> {
  label: { icon: JSX.Element, label: string } & ComponentsPublic;
}

interface CollapsableMenuProps extends ComponentsPublic, Omit<TabsProps, 'items'> {
  items: items[];
  defaultCollapsed?: boolean;
  onCollapse?: (isCollapsed: boolean) => any;
}

export default function LayoutCollapsableTabs({
                                                defaultCollapsed,
                                                onCollapse,
                                                items,
                                                ...tabsProps
                                              }: CollapsableMenuProps) {
  defaultCollapsed = defaultCollapsed || false;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  useEffect(() => {
    if (onCollapse) onCollapse(collapsed);
  }, [collapsed]);
  const [selected, Select] = useState<string | undefined>(tabsProps.defaultActiveKey);
  return (
    <StyleProvider hashPriority={'high'}>
      <div className={'CollapsableMenu'}>
        <Tabs {...tabsProps as unknown as TabsProps} items={
          items.map((item): Tab => {
            return {
              ...item,
              ...{
                label:
                  <Popover content={collapsed ? item.label.label : undefined} placement={'right'}>
                    <span className={item.label.className}
                          style={{ ...item.label.style, ...{ maxWidth: collapsed ? '4vw' : item.label.style?.maxWidth } }}>
                      {item.label.icon}
                      <p>{item.label.label}</p>
                    </span>
                  </Popover>
              }
            };
          })} activeKey={selected} onChange={(activeKey) => {
          Select(activeKey);
          if (tabsProps.onChange) tabsProps.onChange(activeKey);
        }} />
        <Button onClick={() => setCollapsed(!collapsed)} icon={<Icon icon={arrowIcon} className={'icon'}
                                                                     style={{ transform: (collapsed ? 'rotateZ(180deg) scale(0.8)' : 'scale(0.8)') }} />}
                className={'CollapseButton'} style={{ left: (collapsed ? '7vw' : '18vw') }} />
      </div>
    </StyleProvider>);
}
