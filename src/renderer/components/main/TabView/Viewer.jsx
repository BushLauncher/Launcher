import styles from './TabViewStyle.module.css';
import EmptyView from '../../views/emptyView';

export default function TabViewer({ View, navBarVisibility }) {
  const getContent = () => {
    if (View) return typeof View === 'function' ? View() : View;
    else return EmptyView();

  };
  return <div className={styles.Viewer}
              style={{ borderRadius: (navBarVisibility !== undefined && !navBarVisibility ? '20px' : undefined) }}>{getContent()}</div>;
}
