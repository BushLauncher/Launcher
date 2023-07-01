import styles from './TabViewStyle.module.css';
import { ReactNode } from 'react';

export default function TabViewer({ View, navBarVisibility }: {
  View: JSX.Element | (() => JSX.Element), navBarVisibility?: boolean
}) {
  function getView() {
    return (typeof View === 'function' ? View() : View) as unknown as ReactNode;
  }

  return (
    <div className={styles.Viewer}
         style={{ borderRadius: ((navBarVisibility !== undefined && !navBarVisibility) ? '20px' : undefined) }}>
      {getView()}
    </div>);
}
