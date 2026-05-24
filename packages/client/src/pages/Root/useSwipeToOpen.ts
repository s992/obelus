import { useDrag } from '@use-gesture/react';
import { type RefObject, useRef } from 'react';

import { NAV_WIDTH, SWIPE_TRIGGER_WIDTH } from './constants';

type Props = {
  navRef: RefObject<HTMLDivElement>;
  onOpen?: () => void;
  onClose?: () => void;
  enabled?: boolean;
} & ({ direction: 'open'; onOpen: () => void } | { direction: 'close'; onClose: () => void });

const OPEN_THRESHOLD = 60;
const VELOCITY_THRESHOLD = 0.5;

export function useSwipeToOpen({ navRef, direction, onOpen, onClose, enabled }: Props) {
  const dragging = useRef(false);

  return useDrag(
    ({ initial, movement, velocity, direction: swipeDirection, last, cancel }) => {
      const [startX] = initial;
      const [mx] = movement;
      const [vx] = velocity;
      const [dx] = swipeDirection;

      if (direction === 'open' && window.innerWidth - startX > SWIPE_TRIGGER_WIDTH) {
        cancel();
        return;
      }

      const el = navRef?.current;

      if (!el) {
        cancel();
        return;
      }

      const sign = direction === 'open' ? -1 : 1;
      const commitDirection = direction === 'open' ? -1 : 1;
      const resetTranslate = direction === 'open' ? '100% 0' : '0% 0';
      const onCommit = direction === 'open' ? onOpen : onClose;
      const raw = sign * mx;

      if (direction === 'close' && raw < 0) {
        cancel();
        return;
      }

      const dragDistance = Math.min(Math.abs(mx), NAV_WIDTH);
      const percent = (dragDistance / NAV_WIDTH) * 100;

      if (!last) {
        // disable css transitions while dragging
        if (!dragging.current) {
          // this is a valid usage of mutability
          // oxlint-disable-next-line react-hooks-js/immutability
          el.style.transition = 'none';
          dragging.current = true;
        }

        el.style.translate = `${direction === 'open' ? 100 - percent : percent}% 0`;
      } else {
        // on release, clear our transition disable
        dragging.current = false;
        el.style.transition = '';

        const shouldCommit = dragDistance > OPEN_THRESHOLD || (vx > VELOCITY_THRESHOLD && dx * commitDirection > 0);

        if (shouldCommit) {
          el.style.translate = '';
          onCommit();
        } else {
          el.style.translate = resetTranslate;
        }
      }
    },
    { axis: 'x', enabled, filterTaps: true, pointer: { touch: true } },
  );
}
