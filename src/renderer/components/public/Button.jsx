import styles from './css/publicStyle.module.css'

export default function Button({ action, label, className, type }) {
  if (type !== undefined && type !== 'square') {
    console.warn("'type' of Button is not valid !")
  }
  return (
    <div
      onClick={action}
      className={[styles.Button, type ? styles[type] : '', className].join(' ')}
    >
      {label}
    </div>
  )
}
