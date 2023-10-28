import React from 'react';

export interface DefaultProps {
  className?: string,
  style?: React.CSSProperties
}

export const NotificationParam = {
  info: {
    autoClose: 2000, closeButton: false, pauseOnHover: false
  }, success: {
    type: 'success', isLoading: false, autoClose: undefined, hideProgressBar: false
  }, stuck: {
    isLoading: false, closeButton: true, autoClose: false, hideProgressBar: true
  }
};
