import { ConfigurationBackground, ConfigurationLocalBackground } from '../../../public/Configuration';

import vanillaBackground from '../../../assets/graphics/backgrounds/java.png';
import caveBackground from '../../../assets/graphics/backgrounds/forge.png';
import underwaterBackground from '../../../assets/graphics/backgrounds/underwater.png';
import { ComponentsPublic } from '../ComponentsPublic';


export function DecodeBackground(background: ConfigurationBackground): string {
  if (background.type === 'Local') {
    switch (background.data) {
      case ConfigurationLocalBackground.vanilla:
        return vanillaBackground;
      case ConfigurationLocalBackground.cave:
        return caveBackground;
      case ConfigurationLocalBackground.underwater:
        return underwaterBackground;
      default: {
        console.error('Background of type \'' + background.type + '\' don\'t contain valid data');
        return '';
      }
    }
  } else return background.data;
}

export interface BackgroundProps extends ComponentsPublic {
  background: ConfigurationBackground;
}

export default function Background(props: BackgroundProps) {
  return <img src={DecodeBackground(props.background)} alt='Background image' className={props.className} style={props.style} />;
}
