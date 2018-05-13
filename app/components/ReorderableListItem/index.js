import React from 'react';
import PropTypes from 'prop-types';

import { Draggable } from 'react-beautiful-dnd';

class ReorderableListItem extends React.PureComponent {
  render() {
    const {
      children,
      id,
      index,
      disabled,
    } = this.props;

    return (
      <Draggable
        draggableId={id}
        type="REORDERABLE_ITEM"
        index={index}
        isDragDisabled={disabled}
      >
        {(provided) => (
          <div>
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={provided.draggableProps.style}
            >
              {children}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Draggable>
    );
  }
}

ReorderableListItem.propTypes = {
  children: PropTypes.any,
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
};

export default ReorderableListItem;
