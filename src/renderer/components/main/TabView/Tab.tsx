import styles from './TabViewStyle.module.css';
import { TabParams } from './TabView';

export default function Tab({ data, isSelected, onSelect }: {
  data: TabParams,
  isSelected: boolean,
  onSelect: (action?: () => any) => any
}) {
  function getDisplayName() {
    return data.id ? data.id : data.id.charAt(0).toUpperCase() + data.id.slice(1);
  }

  return (<div
    className={[styles.Tab, isSelected ? styles.selected : ''].join(' ')}
    onClick={() => {
      if (!isSelected) onSelect(data.onClickAction);
    }}
    style={data.style}
  >
    {data.iconPath && <div
      className={styles.icon}
      style={{ backgroundImage: `url(${data.iconPath})` }}
    />}
    <p className={styles.label}>{getDisplayName()}</p>
  </div>);
}
