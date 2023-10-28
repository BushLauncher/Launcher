import styles from '../../css/publicStyle.module.css';
import icon from '../../../assets/graphics/icons/loading.svg';
import { ReactElement, useEffect, useState } from 'react';
import { DefaultProps } from '../../../types/DefaultProps';

interface LoaderProps extends DefaultProps {
  children: (reload: () => void) => Promise<ReactElement>;
}

export default function Loader({ children, className, style }: LoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState(null);
  useEffect(() => {
    children(reload)
      .then((data) => {
        // @ts-ignore
        setCurrentContent(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [children]);

  const reload = () => {
    setIsLoading(true);
    children(reload)
      .then((data) => {
        // @ts-ignore
        setCurrentContent(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className={[className].join(' ')} style={style}>
      {isLoading && (
        <div
          className={styles.Loader}
          style={{ backgroundImage: `url(${icon})` }}
        />
      )}
      {!isLoading && currentContent}
    </div>
  );
}
