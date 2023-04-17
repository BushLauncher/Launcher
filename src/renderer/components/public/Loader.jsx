import styles from './css/publicStyle.module.css';
import icon from '../../../assets/graphics/icons/loading.svg';
import { useEffect, useState } from 'react';

export default function Loader({ content, className, style }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentContent, setCurrentContent] = useState(null);

  useEffect(() => {
    content().then((loadedContent) => {
      setCurrentContent(loadedContent);
      setIsLoading(false);
    });
  }, [content]);
  return (
    <div className={[styles.LoadedContent, className].join(' ')} style={style}>
      {isLoading && (
        <div className={styles.Loader} style={{ backgroundImage: `url(${icon})`}}></div>
      )}
      {!isLoading && currentContent}
    </div>
  );
}
