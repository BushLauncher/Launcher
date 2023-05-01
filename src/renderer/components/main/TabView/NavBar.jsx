import styles from './TabViewStyle.module.css';
import ButtonStyle from '../../public/css/inputStyle.module.css';
import Tab from './Tab';
import Button, { ButtonType } from '../../public/Input/Button';
import { useState } from 'react';
import arrowIcon from '../../../../assets/graphics/icons/caret-left.svg';

export default function TabNavBar({
                                    whichIsSelected,
                                    select,
                                    tabList,
                                    collapsable,
                                    collapsed,
                                    styleSettings
                                  }) {
  const [isCollapsed, setCollapsed] = useState(collapsed ? collapsed : false);
  return (
    <div
      className={[styles.NavBar].join(' ')}
      data-collapsed={collapsable ? isCollapsed.toString() : null}
      data-align={styleSettings.tabAlign !== undefined ? styleSettings.tabAlign : 'Top'}
      data-visible={styleSettings.navBarBackgroundVisibility}
      data-onselected={styleSettings.tabSelectionEffect}
    >
      {tabList.map((tab, index) => (
        <Tab
          key={index}
          data={tab}
          isSelected={index === tabList.indexOf(whichIsSelected)}
          onSelect={(action) => select(index, action)}
        />
      ))}
      {collapsable && (
        <Button
          action={() => setCollapsed(!isCollapsed)}
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
