import styles from './TabViewStyle.module.css'
import EmptyView from '../../views/emptyView'

export default function TabViewer({ View }) {
  const getContent = () => {
    return View ? View() : EmptyView()
  }
  return <div className={styles.Viewer}>{getContent()}</div>
}
