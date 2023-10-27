import styles from '../../../css/publicStyle.module.css';
import { DefaultProps } from '../../../../types/DefaultProps';
import { GameType } from '../../../../types/Versions';

import JavaIcon from '../../../../assets/graphics/images/minecraft_java_logo.png';

interface GameImageProps extends DefaultProps {
  type: GameType;
}

/**
 * Image by game type
 */
export default function GameImage(props: GameImageProps) {
  const DecodeImage = () => {
      switch (props.type) {
        case GameType.VANILLA:
          return JavaIcon;
        default: {
          console.error('Image for game type \'' + props.type + '\' is not registered');
          return '';
        }
      }
  };
  return (
    <img
      style={props.style}
      src={DecodeImage()}
      alt={'Game image'}
      className={[styles.GameImage, props.className].join(' ')}
    />
  );
}
