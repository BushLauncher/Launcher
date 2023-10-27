import Loader from './Loader';
import { DefaultProps } from '../../../types/DefaultProps';

export interface DataTextComponentProps extends DefaultProps {
  data: string;
}

export default function DataTextComponent({ data, className, style }: DataTextComponentProps) {
  return <Loader content={async () => {
    const getData = async () => {
      switch (data) {
        case 'app-version':
          return await window.version.app();
        default:
          return 'wrong "data" value';
      }
    };
    return <p className={className} style={style}>{await getData()}</p>;
  }} className={className} style={style} />;
};
