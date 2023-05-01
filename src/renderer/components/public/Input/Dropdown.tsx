import styles from '../css/inputStyle.module.css';
import { ComponentsPublic } from '../../ComponentsPublic';
import Icon from '../Icons/Icon';
import arrowIcon from '../../../../assets/graphics/icons/arrow_down.svg';
import React from 'react';
import Button, { ButtonType } from './Button';

export interface DropdownProps extends ComponentsPublic {
  content: string[];
  label?: string;
  selected?: number;
  onSelect: (option: string) => void;
}

export default function Dropdown({ content, label, onSelect, selected }: DropdownProps) {
  const [isOpened, setOpen] = React.useState(false);
  const [selectedOption, _select] = React.useState(selected && content.length >= selected ? content[selected] : content[0]);

  function Select(index: number) {
    onSelect(content[index]);
    _select(content[index]);
  }

  return <div className={styles.Dropdown}>
    <div className={styles.selectedContainer}>
      <p className={styles.label}>{label ? label : selectedOption}</p>
      <Button className={isOpened ? styles.selected : ''} action={() => setOpen(!isOpened)}
              content={<Icon icon={arrowIcon} />} type={ButtonType.StyleLess} />
    </div>
    {isOpened && <div className={styles.dropper}>{
      content.map((text, index) => {
        console.log(text + ' : ' + selectedOption);
        return <Button className={[styles.option, text == selectedOption ? styles.selected : null].join(' ')}
                       key={index} action={() => Select(index)}
                       content={<p>{text}</p>}
                       type={ButtonType.StyleLess} />;
      })
    }</div>}
  </div>;
}
