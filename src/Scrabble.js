import React from "react";
import moment from "moment";
import { times } from "lodash";
import classNames from "classnames";
import HTML5Backend from "react-dnd-html5-backend";
import { DragSource, DropTarget, DragDropContext } from "react-dnd";
import FlipMove from "react-flip-move";
import Toggle from "./Toggle.js";
import helpers from "./helpers.js";
import { MyContext } from "./App.js";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 7;
const SQUARE_SIZE = 56;
const TILE_OFFSET = 3;

@DragDropContext(HTML5Backend)
class Scrabble extends React.Component {
  constructor() {
    super();

    this.updateDroppedTilePosition = this.updateDroppedTilePosition.bind(this);
  }

  updateDroppedTilePosition({ x, y }, tile) {
    // Normally, this would be done through a Redux action, but because this
    // is such a contrived example, I'm just passing the action down through
    // the child.

    // Create a copy of the state, find the newly-dropped tile.
    let stateTiles = this.props.tiles.slice();
    const index = stateTiles.findIndex(stateTile => stateTile.id === tile.id);
    // Set it to a new copy of the tile, but with the new coords
    stateTiles[index] = { ...tile, x, y };
    this.props.updateTiles(stateTiles);
  }

  renderTiles() {
    return this.props.tiles.map((tile, index) => {
      return (
        <Tile key={index} onDrop={this.updateDroppedTilePosition} scoreHash={this.props.scoreHash}{...tile} />
      );
    });
  }

  renderBoardSquares() {
    // Create a 2D array to represent the board
    // Array#matrix is a monkeypatched, custom method >:)
    const matrix = Array.matrix(BOARD_WIDTH, BOARD_HEIGHT);
    return matrix.map((row, rowIndex) =>
      row.map(index => {
        return (
          <BoardSquare
            x={index}
            y={rowIndex}
            onDrop={this.updateDroppedTilePosition}
            key={index}
          />
        );
      })
    );
  }

  render() {
    return (
      <MyContext.Consumer>
        {context => (
          <div id="scrabble">
            <div className="board-border">
              <div className="board">
                <FlipMove duration={200} staggerDelayBy={150}>
                  {this.renderTiles()}
                </FlipMove>
                {this.renderBoardSquares()}
              </div>
            </div>
          </div>
        )}
      </MyContext.Consumer>
    );
  }
}

const tileSource = {
  beginDrag(props) {
    return props;
  }
};

const tileTarget = {
  drop(props, monitor) {
    const tile1 = props;
    const tile2 = monitor.getItem();

    props.onDrop(tile1, tile2);
    props.onDrop(tile2, tile1);
  }
};

@DropTarget("tile", tileTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver()
}))
@DragSource("tile", tileSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging()
}))
class Tile extends React.Component {
  render() {
    const {
      connectDropTarget,
      connectDragSource,
      isDragging,
      letter,
      x,
      y
    } = this.props;

    const styles = {
      left: x * SQUARE_SIZE - TILE_OFFSET,
      top: y * SQUARE_SIZE - TILE_OFFSET,
      zIndex: `${x + 1}${y + 1}`,
      opacity: isDragging ? 0.5 : 1
    };

    return connectDropTarget(
      connectDragSource(
        <div className="tile animated fadeInDown" style={styles}>
          <span className="tile-letter">{letter}</span>
          <span className="tile-points">{this.props.scoreHash[letter.toLowerCase()].points ? this.props.scoreHash[letter.toLowerCase()].points : 0}</span>
        </div>
      )
    );
  }
}

const squareTarget = {
  drop(props, monitor) {
    props.onDrop(props, monitor.getItem());
  }
};

@DropTarget("tile", squareTarget, (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver()
}))
class BoardSquare extends React.Component {
  renderSquare() {
    const classes = classNames({
      "board-square": true,
      "dragged-over": this.props.isOver
    });

    return <div className={classes} />;
  }
  render() {
    if (this.props.tile) {
      // If this square already has a tile in it, we don't want to allow drops.
      return this.renderSquare();
    } else {
      return this.props.connectDropTarget(this.renderSquare());
    }
  }
}

export default Scrabble;
