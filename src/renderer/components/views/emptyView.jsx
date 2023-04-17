import styles from './css/emptyViewStyle.module.css'

export default function EmptyView() {
  return (
    <div className={styles.Content}>
      <p className={styles.message}>Nothing to show.</p>
    </div>
  )
}
