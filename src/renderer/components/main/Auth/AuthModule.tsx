import styles from '../../../css/AuthModuleStyle.module.css';
import { DefaultProps } from '../../../../types/DefaultProps';
import AuthManager from './AuthManager';

export interface AuthModuleProps extends DefaultProps {
    authManager: AuthManager
}

export default function AuthModule(props: AuthModuleProps) {
  return (
    <div className={[styles.AuthModule, props.className].join(' ')} style={props.style}>
        
    </div>
  );
}
