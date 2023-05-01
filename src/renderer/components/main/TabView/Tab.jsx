import styles from './TabViewStyle.module.css';

export default function Tab({ data, isSelected, onSelect }) {
  function getDisplayName() {
    return data.displayName ? data.displayName : data.id.charAt(0).toUpperCase() + data.id.slice(1);
  }

  return (
    <div
      className={[styles.Tab, isSelected ? styles.selected : ''].join(' ')}
      onClick={() => {
        if (!isSelected) onSelect(data.action);
      }}
      style={data.style}
    >
      {data.iconPath && <div
        className={styles.icon}
        style={{ backgroundImage: `url(${data.iconPath})` }}
      />}
      <p className={styles.label}>{getDisplayName()}</p>
    </div>
  );
}
