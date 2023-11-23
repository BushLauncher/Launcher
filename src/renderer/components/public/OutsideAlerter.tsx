import React, { ReactNode, useEffect, useRef } from 'react';
import { DefaultProps } from '../../../types/DefaultProps';

//https://stackoverflow.com/a/42234988


interface OutsideAlerterProps extends DefaultProps {
  children: React.ReactElement | ReactNode
  onClickOutside: (event: MouseEvent) => any
  exceptElementClasses?: string[];
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
      function handleClickOutside(event: MouseEvent) {
        if (isClickOutsideElement(event, ref.current)) {
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

  function isClickOutsideElement(event: MouseEvent, element: HTMLElement): boolean {
    /**
     * This function detects if a click event occurred outside a specific HTML element,
     * taking into account the element's child elements, padding, overflow, scroll, and z-index.
     *
     * Parameters:
     * event (MouseEvent): The click event to be checked
     * element (HTMLElement): The HTML element to check if the click occurred outside of
     *
     * Returns:
     * boolean: True if the click occurred outside the element, False otherwise
     */

      // Get the target element that was clicked
    const target = event.target as HTMLElement;


    // Check if the target element is the element itself or one of its descendants
    if (element.contains(target)) {
      return false;
    }

    // Check if the target element is within any child elements of the element
    const childElements = element.querySelectorAll('*');
    for (let i = 0; i < childElements.length; i++) {
      if (childElements[i].contains(target)) {
        return false;
      }
    }

    // Check if the target element is within any parent elements of the element
    let parentElement = target.parentElement;
    while (parentElement) {
      if (parentElement === element) {
        return false;
      }
      parentElement = parentElement.parentElement;
    }

    // Check if the target element has any of the extra classes
    const hasExtraClass = props.exceptElementClasses?.some(className => (event.target as HTMLElement).classList.contains(className));


    return !hasExtraClass;

  }

  return <div className={[props.className].join(' ')} style={props.style} ref={wrapperRef}>{props.children}</div>;
}

