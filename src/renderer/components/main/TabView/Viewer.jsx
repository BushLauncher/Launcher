import styles from './TabViewStyle.module.css';

export default function TabViewer({ View, navBarVisibility }) {
  return (
    <div className={styles.Viewer}
         style={{ borderRadius: (navBarVisibility !== undefined && !navBarVisibility ? '20px' : undefined) }}>
      {typeof View === 'function' ? View() : View}
    </div>);
}
