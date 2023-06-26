import Loader from './Loader';
import { ComponentsPublic } from '../ComponentsPublic';

export interface DataTextComponentProps extends ComponentsPublic {
  data: string;
}

export default function DataTextComponent({ data, className, style }: DataTextComponentProps) {
  return <Loader content={async () => {
    switch (data) {
      case 'app-version':
        // @ts-ignore
        return <p>{await window.version.app()}</p>;
      default:
        return <p>{'wrong "data" value'}</p>;
    }
  }} className={className} style={style} />;
};
