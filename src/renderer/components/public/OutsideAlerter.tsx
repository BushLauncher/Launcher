import React, { useRef, useEffect } from 'react';
import { ComponentsPublic } from '../ComponentsPublic';
import styles from "./css/publicStyle.module.css"

//https://stackoverflow.com/a/42234988


interface OutsideAlerterProps extends ComponentsPublic {
  children: JSX.Element,
  onClickOutside: (event: MouseEvent) => any
}

/**
 * Component that alerts if you click outside of it
 */
export default function OutsideAlerter(props: OutsideAlerterProps) {
  const wrapperRef = useRef(null);

  /**
   * Hook that alerts clicks outside of the passed ref
   */
  function useOutsideAlerter(ref: React.MutableRefObject<any>) {
    useEffect(() => {
      /**
       * Alert if clicked on outside of element
       */
      function handleClickOutside(event: any) {
        if (ref.current && !ref.current.contains(event.target)) {
          props.onClickOutside(event);
        }
      }

      // Bind the event listener
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        // Unbind the event listener on clean up
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [ref]);
  }

  useOutsideAlerter(wrapperRef);

  return <div className={[props.className].join(' ')} style={props.style} ref={wrapperRef}>{props.children}</div>;
}
