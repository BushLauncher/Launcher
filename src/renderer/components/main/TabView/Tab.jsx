import styles from './TabViewStyle.module.css';

export default function Tab({ data, isSelected, onSelect }) {
  return (
    <div
      className={[styles.Tab, isSelected ? styles.selected : ''].join(' ')}
      onClick={() => {
        if (!isSelected) onSelect(data.action);
      }}
      style={data.customStyle}
    >
      <div
        className={styles.icon}
        style={{ backgroundImage: `url(${data.iconPath})` }}
      ></div>
      <p className={styles.label}>{data.displayName}</p>
    </div>
  );
}
