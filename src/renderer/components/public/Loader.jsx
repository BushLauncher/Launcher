import styles from './css/publicStyle.module.css';
import icon from '../../../assets/graphics/icons/loading.svg';
import { useEffect, useState } from 'react';

export default function Loader({ content, className, style }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState(null);

  useEffect(() => {
    content(reload)
      .then((data) => {
        setCurrentContent(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [content]);

  const reload = () => {
    setIsLoading(true);
    content(reload)
      .then((data) => {
        setCurrentContent(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
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
