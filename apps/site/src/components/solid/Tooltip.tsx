import CorvuTooltip, { Trigger, Content } from '@corvu/tooltip';
import type { Component, JSX } from 'solid-js';

type TooltipProps = {
  content: JSX.Element | string;
  placement?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end';
  children: JSX.Element;
};

const Tooltip: Component<TooltipProps> = (props) => {
  return (
    <CorvuTooltip placement="bottom-start">
      <Trigger as="span">{props.children}</Trigger>
      <Content>{props.content}</Content>
    </CorvuTooltip>
  );
};

export default Tooltip;
