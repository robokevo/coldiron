'use strict';

coldIron.Geometry = {};

coldIron.Geometry.Grid = function(width, height, data) {
    this._width = width;
    this._height = height;
    this._data = data || [];

    this.contains = (x, y) => 
        x >= 0 && x < this._width && y >= 0 && y < this._height; 

    this.getWidth = () => this._width;

    this.getHeight = () => this._height;

    this.getValue = (x, y) =>
        this._data[x + this._width * y];

    this.setValue = (x, y, value) =>
        this._data[x + this._width * y] = value;
};

coldIron.Geometry.getDistance = function(startX, startY, endX, endY) {
    // calculates a straight line between two points
    if (startX === endX) {
        return Math.abs(endY - startY);
    } else if (startY === endY) {
        return Math.abs(endX - startX);
    } else {
        return Math.sqrt(Math.pow((startX-endX), 2) + Math.pow((startY-endY), 2));
    }
};