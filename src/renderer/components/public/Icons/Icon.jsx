export default function Icon({ icon, customStyle, alt, className }) {
  return <img src={icon} alt={alt} style={customStyle} className={className} />
}
