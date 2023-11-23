import { forwardRef, ReactElement, useEffect, useImperativeHandle, useState } from 'react';
import { DefaultProps } from '../../../types/DefaultProps';
import styles from '../../css/publicStyle.module.css';
import icon from '../../../assets/graphics/icons/loading.svg';

export interface LoaderProps extends DefaultProps {
  children: (reload: () => void) => Promise<JSX.Element>;
}

export interface LoaderRefType {
  refresh: () => void;
}


const Loader = forwardRef<LoaderRefType, LoaderProps>((props: LoaderProps, ref) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ReactElement | null>(null);

  const refresh = () => {
    setLoading(true);
    props.children(refresh)
      .then((newContent: ReactElement) => {
        setContent(newContent);
        setLoading(false);
      });
  };

  useEffect(() => {
    props.children(refresh)
      .then((initialContent: ReactElement) => {
        setContent(initialContent);
        setLoading(false);
      });
  }, [props.children]);

  // Expose the refresh function to the parent component using ref
  useImperativeHandle(ref, () => ({
    refresh
  }));

  return (
    <div className={[props.className].join(' ')} style={props.style}>
      {loading ? <div
        className={styles.Loader}
        style={{ backgroundImage: `url(${icon})` }}
      /> : content}
    </div>
  );
});

export default Loader;
