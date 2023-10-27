import styles from '../../../css/inputStyle.module.css';
import { DefaultProps } from '../../../../types/DefaultProps';

export interface InputProps extends DefaultProps{
  label?: string | React.ReactNode;
  children: JSX.Element[] | JSX.Element
}
export default function LabeledInput(props: InputProps) {
  return <div className={styles.input}>
    {typeof props.label === 'string' ?
      <p className={styles.label}>{props.label + ":"}</p>
      : props.label
    }
    {props.children}
  </div>;
}
