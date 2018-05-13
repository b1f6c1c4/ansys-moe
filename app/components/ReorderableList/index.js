import React from 'react';
import PropTypes from 'prop-types';

import {
  List,
} from 'material-ui';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

class ReorderableList extends React.PureComponent {
  onDragEnd = ({ source, destination }) => {
    if (!destination) return;

    this.props.onReorder({
      from: source.index,
      to: destination.index,
    });
  };

  render() {
    // eslint-disable-next-line no-unused-vars
    const { children, onReorder, ...other } = this.props;

    return (
      <DragDropContext
        onDragEnd={this.onDragEnd}
      >
        <List {...other}>
          <Droppable
            droppableId="REORDERABLE_LIST"
            type="REORDERABLE_ITEM"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {children}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </List>
      </DragDropContext>
    );
  }
}

ReorderableList.propTypes = {
  children: PropTypes.any,
  onReorder: PropTypes.func.isRequired,
};

export default ReorderableList;
