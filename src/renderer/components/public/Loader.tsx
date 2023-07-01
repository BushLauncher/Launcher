import styles from './css/publicStyle.module.css';
import icon from '../../../assets/graphics/icons/loading.svg';
import { useEffect, useState } from 'react';
import { ComponentsPublic } from '../ComponentsPublic';

interface LoaderProps extends ComponentsPublic {
  content: (reload: () => void) => Promise<Element | JSX.Element>;
}

export default function Loader({ content, className, style }: LoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState(null);
  useEffect(() => {
    content(reload)
      .then((data) => {
        // @ts-ignore
        setCurrentContent(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, [content]);

  const reload = () => {
    setIsLoading(true);
    content(reload)
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
    <div className={[styles.LoadedContent, className].join(' ')} style={style}>
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
