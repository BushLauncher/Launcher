import { DefaultProps } from '../../../../types/DefaultProps';
import { ConfigurationIcon, ConfigurationLocalIcon } from '../../../../types/Configuration';

import JavaIcon from '../../../../assets/graphics/images/grass_block.png';
import Icon from './Icon';

interface GameIconProps extends DefaultProps {
  icon: ConfigurationIcon;
}

/**
 * Insert the icon of configuration
 */
export default function GameIcon(props: GameIconProps) {
  const DecodeIcon = () => {
    if (props.icon.type === 'Local') {
      switch (props.icon.data) {
        case ConfigurationLocalIcon.dirt:
          return JavaIcon;
        default: {
          console.error('Icon \'' + props.icon.data + '\' is not registered');
          return '';
        }
      }
    } else return props.icon.data;
  };
  return (
    <Icon icon={DecodeIcon()} style={props.style} className={props.className} />
  );
}
