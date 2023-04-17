import defaultStyle from './css/publicStyle.module.css'

export default function Line({ direction, className, customStyle }) {
  const getClass = () => {
    return direction === 'vertical'
      ? defaultStyle.VerticalLine
      : defaultStyle.HorizontalLine
  }
  return (
    <div
      className={[getClass(), className].join(' ')}
      style={customStyle}
    ></div>
  )
}
